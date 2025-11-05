package io.ton.walletkit.engine.infrastructure

import android.os.Handler
import android.util.Log
import io.ton.walletkit.WalletKitBridgeException
import io.ton.walletkit.browser.TonConnectInjector
import io.ton.walletkit.engine.parsing.EventParser
import io.ton.walletkit.engine.state.EventRouter
import io.ton.walletkit.internal.constants.BridgeMethodConstants
import io.ton.walletkit.internal.constants.EventTypeConstants
import io.ton.walletkit.internal.constants.JsonConstants
import io.ton.walletkit.internal.constants.LogConstants
import io.ton.walletkit.internal.constants.ResponseConstants
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import org.json.JSONObject

/**
 * Routes messages coming from the JavaScript bridge to the appropriate engine components.
 *
 * Responsibilities:
 * * Maintain bridge ready state and trigger reconfiguration when the JS context reloads.
 * * Parse and dispatch typed events to registered handlers.
 * * Coordinate JavaScript-side event listener setup/teardown.
 * * Forward RPC responses to [BridgeRpcClient].
 *
 * @suppress Internal component. Use through [WebViewWalletKitEngine].
 */
internal class MessageDispatcher(
    private val rpcClient: BridgeRpcClient,
    private val eventParser: EventParser,
    private val eventRouter: EventRouter,
    private val initManager: InitializationManager,
    private val webViewManager: WebViewManager,
    private val onInitialized: () -> Unit,
    private val onNetworkChanged: (String?) -> Unit,
    private val onApiBaseUrlChanged: (String?) -> Unit,
) {
    private val mainHandler: Handler = webViewManager.getMainHandler()
    private val eventListenersSetupMutex = Mutex()

    @Volatile private var areEventListenersSetUp = false

    fun dispatchMessage(payload: JSONObject) {
        val kind = payload.optString(ResponseConstants.KEY_KIND)
        Log.d(TAG, "📨 Message kind: $kind")

        when (kind) {
            ResponseConstants.VALUE_KIND_READY -> handleReady(payload)
            ResponseConstants.VALUE_KIND_EVENT -> {
                val event = payload.optJSONObject(ResponseConstants.KEY_EVENT)
                if (event != null) {
                    handleEvent(event)
                } else {
                    Log.w(TAG, "⚠️ EVENT kind but no event object in payload")
                }
            }
            ResponseConstants.VALUE_KIND_RESPONSE -> {
                val id = payload.optString(ResponseConstants.KEY_ID)
                rpcClient.handleResponse(id, payload)
            }
            ResponseConstants.VALUE_KIND_JS_BRIDGE_EVENT -> handleJsBridgeEvent(payload)
            else -> Log.w(TAG, "⚠️ Unknown message kind: $kind")
        }
    }

    suspend fun ensureEventListenersSetUp() {
        Log.d(TAG, "🔵 ensureEventListenersSetUp() called, areEventListenersSetUp=$areEventListenersSetUp")
        if (areEventListenersSetUp) {
            Log.d(TAG, "⚡ Event listeners already set up, skipping")
            return
        }

        Log.d(TAG, "🔵 Acquiring eventListenersSetupMutex...")
        eventListenersSetupMutex.withLock {
            Log.d(TAG, "🔵 eventListenersSetupMutex acquired")

            if (areEventListenersSetUp) {
                Log.d(TAG, "⚡ Event listeners already set up (double-check), skipping")
                return@withLock
            }

            try {
                Log.d(TAG, "🔵 Waiting for WalletKit initialization...")
                initManager.ensureInitialized()
                onInitialized()
                Log.d(TAG, "✅ WalletKit initialization complete")

                Log.d(TAG, "🔵 Calling JS setEventsListeners()...")
                rpcClient.call(BridgeMethodConstants.METHOD_SET_EVENTS_LISTENERS, JSONObject())
                areEventListenersSetUp = true
                Log.d(TAG, "✅✅✅ Event listeners set up successfully! areEventListenersSetUp=true")
            } catch (err: Throwable) {
                Log.e(TAG, "❌ Failed to set up event listeners", err)
                throw WalletKitBridgeException(ERROR_FAILED_SET_UP_EVENT_LISTENERS + err.message)
            }
        }
        Log.d(TAG, "🔵 eventListenersSetupMutex released")
    }

    suspend fun removeEventListenersIfNeeded() {
        if (!areEventListenersSetUp) {
            return
        }
        try {
            rpcClient.call(BridgeMethodConstants.METHOD_REMOVE_EVENT_LISTENERS, JSONObject())
            areEventListenersSetUp = false
            Log.d(TAG, "Event listeners removed from JS bridge (no handlers remaining)")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to remove event listeners from JS bridge", e)
        }
    }

    fun areEventListenersSetUp(): Boolean = areEventListenersSetUp

    private fun handleReady(payload: JSONObject) {
        Log.d(TAG, "🚀 handleReady() called")

        val network = payload.optNullableString(ResponseConstants.KEY_NETWORK)
        initManager.updateNetwork(network)
        onNetworkChanged(network)
        val apiBaseUrl = payload.optNullableString(ResponseConstants.KEY_TON_API_URL)
        initManager.updateApiBaseUrl(apiBaseUrl)
        onApiBaseUrlChanged(apiBaseUrl)
        if (!webViewManager.bridgeLoaded.isCompleted) {
            webViewManager.bridgeLoaded.complete(Unit)
            Log.d(TAG, "🚀 bridgeLoaded completed")
        }
        webViewManager.markJsBridgeReady()

        val wasAlreadyReady = rpcClient.isReady()
        Log.d(TAG, "🚀 wasAlreadyReady=$wasAlreadyReady, ready.isCompleted=${rpcClient.isReady()}")

        if (!rpcClient.isReady()) {
            Log.d(TAG, "🚀 Completing ready for the first time")
            rpcClient.markReady()
        }

        if (wasAlreadyReady && areEventListenersSetUp) {
            Log.w(TAG, "⚠️⚠️⚠️ Bridge ready event received again - JavaScript context was lost! Re-setting up event listeners...")
            areEventListenersSetUp = false
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    Log.d(TAG, "🔵 Re-setting up event listeners after JS context loss...")
                    ensureEventListenersSetUp()
                    Log.d(TAG, "✅ Event listeners re-established after JS context loss")
                } catch (e: Exception) {
                    Log.e(TAG, "❌ Failed to re-setup event listeners after JS context loss", e)
                }
            }
        } else {
            Log.d(TAG, "🚀 Normal ready event (wasAlreadyReady=$wasAlreadyReady, areEventListenersSetUp=$areEventListenersSetUp)")
        }

        val data = JSONObject()
        val keys = payload.keys()
        while (keys.hasNext()) {
            val key = keys.next()
            if (key == ResponseConstants.KEY_KIND) continue
            if (payload.isNull(key)) {
                data.put(key, JSONObject.NULL)
            } else {
                data.put(key, payload.get(key))
            }
        }
        val readyEvent =
            JSONObject().apply {
                put(ResponseConstants.KEY_TYPE, ResponseConstants.VALUE_KIND_READY)
                put(ResponseConstants.KEY_DATA, data)
            }
        Log.d(TAG, "🚀 Calling handleEvent for ready event")
        handleEvent(readyEvent)
        Log.d(TAG, "🚀 handleReady() complete")
    }

    private fun handleEvent(event: JSONObject) {
        val type = event.optString(JsonConstants.KEY_TYPE, EventTypeConstants.EVENT_TYPE_UNKNOWN)
        val data = event.optJSONObject(ResponseConstants.KEY_DATA) ?: JSONObject()
        val eventId = event.optString(JsonConstants.KEY_ID, java.util.UUID.randomUUID().toString())

        Log.d(TAG, "🟢🟢🟢 === handleEvent called ===")
        Log.d(TAG, "🟢 Event type: $type")
        Log.d(TAG, "🟢 Event ID: $eventId")
        Log.d(TAG, "🟢 Event data keys: ${data.keys().asSequence().toList()}")
        Log.d(TAG, "🟢 Thread: ${Thread.currentThread().name}")

        val typedEvent = eventParser.parseEvent(type, data, event)
        Log.d(TAG, "🟢 Parsed typed event: ${(typedEvent?.javaClass?.simpleName ?: ResponseConstants.VALUE_UNKNOWN)}")

        if (typedEvent != null) {
            Log.d(TAG, "🟢 Typed event is NOT null, posting to main handler...")

            mainHandler.post {
                Log.d(TAG, "🟢 Main handler runnable executing for event $type")
                runBlocking {
                    eventRouter.dispatchEvent(eventId, type, typedEvent)
                }
            }
        } else {
            Log.w(TAG, "⚠️ " + MSG_FAILED_PARSE_TYPED_EVENT_PREFIX + type + " - event will be ignored")
        }
    }

    private fun handleJsBridgeEvent(payload: JSONObject) {
        val sessionId = payload.optString("sessionId")
        val event = payload.optJSONObject("event")

        Log.d(TAG, "📤 handleJsBridgeEvent called")
        Log.d(TAG, "📤 sessionId: $sessionId")
        Log.d(TAG, "📤 event: $event")
        Log.d(TAG, "📤 Full payload: $payload")

        if (event == null) {
            Log.e(TAG, "❌ No event object in ${ResponseConstants.VALUE_KIND_JS_BRIDGE_EVENT} payload")
            return
        }

        mainHandler.post {
            try {
                Log.d(TAG, "📤 Looking up WebView for session: $sessionId")
                val targetWebView = TonConnectInjector.getWebViewForSession(sessionId)

                if (targetWebView != null) {
                    Log.d(TAG, "✅ Found WebView for session: $sessionId")
                    val injector = targetWebView.getTonConnectInjector()
                    if (injector != null) {
                        Log.d(TAG, "✅ Found TonConnectInjector, sending event to WebView")
                        Log.d(TAG, "📤 Event being sent: $event")
                        injector.sendEvent(event)
                        Log.d(TAG, "✅ Event sent successfully")
                    } else {
                        Log.w(TAG, "⚠️  WebView found but no TonConnectInjector attached for session: $sessionId")
                    }
                } else {
                    Log.w(TAG, "⚠️  No WebView found for session: $sessionId (browser may have been closed)")
                    Log.w(TAG, "⚠️  This means the WebView was never registered or was garbage collected")
                }
            } catch (e: Exception) {
                Log.e(TAG, "❌ Failed to send JS Bridge event", e)
            }
        }
    }

    private fun JSONObject.optNullableString(key: String): String? {
        val value = opt(key)
        return when (value) {
            null, JSONObject.NULL -> null
            else -> value.toString()
        }
    }

    companion object {
        private const val TAG = LogConstants.TAG_WEBVIEW_ENGINE
        private const val MSG_FAILED_PARSE_TYPED_EVENT_PREFIX = "Failed to parse typed event for type: "
        private const val ERROR_FAILED_SET_UP_EVENT_LISTENERS = "Failed to set up event listeners: "
    }
}

private const val TAG_TON_CONNECT_INJECTOR = "tonconnect_injector"

private fun android.webkit.WebView.getTonConnectInjector(): TonConnectInjector? {
    return getTag(TAG_TON_CONNECT_INJECTOR.hashCode()) as? TonConnectInjector
}
