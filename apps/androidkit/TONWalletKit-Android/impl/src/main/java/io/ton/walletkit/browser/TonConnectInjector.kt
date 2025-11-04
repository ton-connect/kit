package io.ton.walletkit.browser

import android.annotation.SuppressLint
import android.util.Log
import android.view.View
import android.webkit.WebView
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import io.ton.walletkit.ITONWalletKit
import io.ton.walletkit.WebViewTonConnectInjector
import io.ton.walletkit.browser.PendingRequest
import io.ton.walletkit.TONWalletKit
import io.ton.walletkit.engine.WalletKitEngine
import io.ton.walletkit.internal.constants.BridgeMethodConstants
import io.ton.walletkit.internal.constants.BrowserConstants
import io.ton.walletkit.internal.constants.JsonConstants
import io.ton.walletkit.internal.constants.MiscConstants
import io.ton.walletkit.internal.constants.NetworkConstants
import io.ton.walletkit.internal.constants.ResponseConstants
import io.ton.walletkit.internal.constants.WebViewConstants
import io.ton.walletkit.model.TONNetwork
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.lang.ref.WeakReference
import java.util.concurrent.ConcurrentHashMap

/**
 * TonConnect injector for WebViews.
 *
 * This class manages the TonConnect bridge lifecycle, injecting JavaScript code into web pages
 * and automatically routing all requests to the provided TONWalletKit instance.
 *
 * **Automatic Cleanup**: This class automatically cleans up resources when the WebView is
 * detached from the window, preventing memory leaks. You can also call [cleanup] manually
 * if needed (e.g., when reusing a WebView).
 *
 * You typically get an instance of this class by calling `webView.injectTonConnect(walletKit)`.
 */
internal class TonConnectInjector(
    private val webView: WebView,
    private val walletKit: ITONWalletKit,
) : WebViewTonConnectInjector {
    // Helper to access internal engine - cast to concrete implementation
    private val engine: WalletKitEngine?
        get() = (walletKit as? TONWalletKit)?.engine

    companion object {
        private const val TAG = "TonConnectInjector"
        private const val ERROR_WALLET_ENGINE_NOT_INITIALIZED = "Wallet engine not initialized"
        private const val ERROR_FAILED_PROCESS_REQUEST = "Failed to process request"
        private const val ERROR_CODE_INTERNAL = 500
        private const val METHOD_SEND = "send"

        // Registry of active WebViews for JS Bridge sessions
        // Maps sessionId -> WeakReference<WebView> to allow garbage collection
        private val activeWebViews = ConcurrentHashMap<String, WeakReference<WebView>>()

        /**
         * Register a WebView for a JS Bridge session.
         * Called internally when a session is created.
         */
        @JvmStatic
        internal fun registerWebView(sessionId: String, webView: WebView) {
            Log.d(TAG, "Registering WebView for session: $sessionId")
            activeWebViews[sessionId] = WeakReference(webView)
            cleanupStaleReferences()
        }

        /**
         * Unregister a WebView for a JS Bridge session.
         * Called internally when a session is disconnected or WebView is destroyed.
         */
        @JvmStatic
        internal fun unregisterWebView(sessionId: String) {
            Log.d(TAG, "Unregistering WebView for session: $sessionId")
            activeWebViews.remove(sessionId)
        }

        /**
         * Get the WebView associated with a JS Bridge session.
         * Returns null if the WebView has been garbage collected or was never registered.
         */
        @JvmStatic
        internal fun getWebViewForSession(sessionId: String): WebView? {
            Log.d(TAG, "🔍 getWebViewForSession called for: $sessionId")
            Log.d(TAG, "🔍 Total registered sessions: ${activeWebViews.size}")
            Log.d(TAG, "🔍 Registered session IDs: ${activeWebViews.keys.joinToString(", ")}")

            val webViewRef = activeWebViews[sessionId]
            val webView = webViewRef?.get()

            Log.d(TAG, "🔍 WebView reference found: ${webViewRef != null}")
            Log.d(TAG, "🔍 WebView still alive: ${webView != null}")

            // Clean up stale reference if WebView was garbage collected
            if (webView == null && webViewRef != null) {
                activeWebViews.remove(sessionId)
                Log.d(TAG, "Removed stale WebView reference for session: $sessionId")
            }

            return webView?.also {
                Log.d(TAG, "✅ Found WebView for session: $sessionId")
            }
        }

        /**
         * Clean up stale WebView references where the WebView has been garbage collected.
         * Called periodically to prevent map from growing indefinitely.
         */
        @JvmStatic
        private fun cleanupStaleReferences() {
            val staleKeys = activeWebViews.entries
                .filter { it.value.get() == null }
                .map { it.key }

            staleKeys.forEach { activeWebViews.remove(it) }

            if (staleKeys.isNotEmpty()) {
                Log.d(TAG, "Cleaned up ${staleKeys.size} stale WebView references")
            }
        }

        /**
         * Clear all WebView registrations.
         * Called internally during cleanup.
         */
        @JvmStatic
        internal fun clearAllRegistrations() {
            Log.d(TAG, "Clearing all WebView registrations")
            activeWebViews.clear()
        }
    }

    // Use application context to avoid leaking Activity context
    private val context = webView.context.applicationContext
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val pendingRequests = ConcurrentHashMap<String, PendingRequest>()
    private val pendingResponses = ConcurrentHashMap<String, Pair<PendingRequest, JSONObject>>()
    private var isCleanedUp = false

    // Store reference to BridgeInterface for response delivery
    private lateinit var bridgeInterface: BridgeInterface

    // Track the current dApp URL for domain extraction
    @Volatile
    private var currentUrl: String? = null

    // Listener to automatically cleanup when WebView is detached
    // NOTE: Disabled automatic cleanup on detach because WebView may be temporarily
    // detached when showing Connect/Transaction sheets. Cleanup is now manual via
    // BrowserSheet's DisposableEffect or when the parent screen is destroyed.
    private val detachListener = object : View.OnAttachStateChangeListener {
        override fun onViewAttachedToWindow(v: View) {
            Log.d(TAG, "WebView attached to window")
            // Deliver any pending responses that were queued while detached
            deliverPendingResponses()
        }

        override fun onViewDetachedFromWindow(v: View) {
            Log.d(TAG, "WebView detached from window (NOT cleaning up - may be temporary)")
            // Do NOT call cleanup() here - the WebView may just be temporarily hidden
            // when showing Connect/Transaction request sheets
        }
    }

    /**
     * Set up TonConnect support with default WebViewClient.
     * This will replace any existing WebViewClient and WebChromeClient.
     */
    @SuppressLint("SetJavaScriptEnabled")
    override fun setup() {
        // Register automatic cleanup listener
        webView.addOnAttachStateChangeListener(detachListener)

        // Add JavaScript interface for bridge communication
        // Store reference so we can call storeResponse() later
        bridgeInterface = BridgeInterface(
            onMessage = { json, type -> handleBridgeMessage(json, type) },
            onError = { error -> Log.e(TAG, "Bridge error: $error") },
        )
        webView.addJavascriptInterface(
            bridgeInterface,
            BrowserConstants.JS_INTERFACE_NAME,
        )

        // CRITICAL: Use WebViewCompat.addDocumentStartJavaScript for early injection
        // This is the proper Android API to inject JavaScript before HTML parsing begins
        // (similar to iOS WKUserScript with injectionTime = .atDocumentStart)
        if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
            try {
                // Load inject.mjs from assets
                val injectionScript = context.assets.open(BrowserConstants.INJECT_SCRIPT_PATH)
                    .bufferedReader()
                    .use { it.readText() }

                // Allow all origins (*) since this is a wallet browser that loads any dApp
                val allowedOrigins = setOf("*")

                WebViewCompat.addDocumentStartJavaScript(
                    webView,
                    injectionScript,
                    allowedOrigins,
                )

                Log.d(TAG, "✅ Bridge script registered via addDocumentStartJavaScript (executes before HTML parsing)")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to add document start script, falling back to onPageStarted injection", e)
                // Fallback: inject in onPageStarted (less reliable but better than nothing)
                BridgeInjector.injectIntoAllFrames(context, webView) { error ->
                    Log.e(TAG, "Bridge injection error: $error")
                }
            }
        } else {
            Log.w(TAG, "⚠️ DOCUMENT_START_SCRIPT not supported, using fallback injection (may have timing issues)")
            // Fallback for older Android versions
            BridgeInjector.injectIntoAllFrames(context, webView) { error ->
                Log.e(TAG, "Bridge injection error: $error")
            }
        }

        // Set custom WebViewClient to inject bridge on page load
        webView.webViewClient = TonConnectWebViewClient(
            onPageStarted = { url ->
                // Update current URL for domain extraction
                // Always update - user can navigate from host/a to host/b
                currentUrl = url
                Log.d(TAG, "✅ Current dApp URL updated: $url")

                // Emit page started event
                scope.launch {
                    try {
                        engine?.callBridgeMethod(
                            method = BridgeMethodConstants.METHOD_EMIT_BROWSER_PAGE_STARTED,
                            params = JSONObject().apply {
                                put(ResponseConstants.KEY_URL, url)
                            },
                        )
                    } catch (e: Exception) {
                        Log.w(TAG, "Failed to emit page started event", e)
                    }
                }
            },
            onPageFinished = { url ->
                Log.d(TAG, "📍 Page finished loading: $url")

                // Emit page finished event
                scope.launch {
                    try {
                        engine?.callBridgeMethod(
                            method = BridgeMethodConstants.METHOD_EMIT_BROWSER_PAGE_FINISHED,
                            params = JSONObject().apply {
                                put(ResponseConstants.KEY_URL, url)
                            },
                        )
                    } catch (e: Exception) {
                        Log.w(TAG, "Failed to emit page finished event", e)
                    }

                    // Check for existing session and restore connection UI
                    // Only do this if this is the main page (matches currentUrl)
                    if (url == currentUrl) {
                        try {
                            restoreSessionIfExists(url)
                        } catch (e: Exception) {
                            Log.w(TAG, "Failed to restore session", e)
                        }
                    }
                }
            },
            onError = { error ->
                Log.e(TAG, "WebView error: $error")
                // Emit error event
                scope.launch {
                    try {
                        engine?.callBridgeMethod(
                            method = BridgeMethodConstants.METHOD_EMIT_BROWSER_ERROR,
                            params = JSONObject().apply {
                                put(ResponseConstants.KEY_MESSAGE, error)
                            },
                        )
                    } catch (e: Exception) {
                        Log.w(TAG, "Failed to emit error event", e)
                    }
                }
            },
            injectBridge = { view -> injectBridgeIntoAllFrames(view) },
            onTonConnectUrl = { url ->
                // Intercept deep link navigation to prevent ERR_UNKNOWN_URL_SCHEME
                // The dApp should use the injected bridge instead (embedded: true tells it to)
                Log.d(TAG, "Intercepted deep link navigation (prevented): $url")
                Log.w(TAG, "⚠️ dApp tried to open deep link instead of using injected bridge - this indicates timing issue")
            },
            getInjectionScript = {
                // Load the bridge script from assets for HTML interception
                try {
                    context.assets.open(BrowserConstants.INJECT_SCRIPT_PATH)
                        .bufferedReader()
                        .use { it.readText() }
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to load inject.mjs for HTML interception", e)
                    ""
                }
            },
        )

        // Set custom WebChromeClient to track dynamic iframes
        webView.webChromeClient = TonConnectWebChromeClient(
            injectBridge = { view -> injectBridgeIntoAllFrames(view) },
        )
    }

    /**
     * Send a response back to a dApp for a specific request.
     *
     * @param messageId The ID from the original request
     * @param response The response data to send back
     */
    fun sendResponse(messageId: String, response: JSONObject) {
        Log.d(TAG, "🔵 sendResponse called for messageId: $messageId")
        Log.d(TAG, "🔵 Pending requests: ${pendingRequests.keys}")
        Log.d(TAG, "🔵 Response: $response")

        val pending = pendingRequests.remove(messageId)
        if (pending == null) {
            Log.w(TAG, "⚠️ No pending request found for messageId: $messageId")
            Log.w(TAG, "⚠️ Available pending requests: ${pendingRequests.keys}")
            return
        }

        // If this is a successful connect response, register this WebView for the session
        if (pending.method == BrowserConstants.EVENT_CONNECT && response.has(ResponseConstants.KEY_PAYLOAD)) {
            try {
                // Register with messageId (for immediate responses)
                registerWebView(messageId, webView)
                Log.d(TAG, "✅ Registered WebView with messageId: $messageId")

                // CRITICAL FIX: After sending the response, query WalletKit for the sessionId
                // and register the WebView with it too (for disconnect later)
                scope.launch {
                    try {
                        // Give WalletKit time to create the session
                        kotlinx.coroutines.delay(500)

                        // Get all sessions from WalletKit
                        val sessions = engine?.callBridgeMethod(BridgeMethodConstants.METHOD_LIST_SESSIONS, null)
                        Log.d(TAG, "🔍 Got sessions for WebView re-registration: $sessions")

                        // Find the session that was just created (by messageId)
                        // Initially we register the WebView with messageId for immediate responses
                        // Now we need to re-register it with the session's sessionId for events

                        // Parse sessions and find matching one
                        if (sessions is JSONObject && sessions.has(ResponseConstants.KEY_ITEMS)) {
                            val items = sessions.getJSONArray(ResponseConstants.KEY_ITEMS)
                            for (i in 0 until items.length()) {
                                val session = items.getJSONObject(i)
                                val sessionId = session.optString(ResponseConstants.KEY_SESSION_ID)
                                // Check if this session matches our messageId
                                // We can't directly check, so register ALL JS Bridge sessions
                                // This is safe because we're using the same WebView
                                Log.d(TAG, "🔄 Registering WebView for sessionId: $sessionId")
                                registerWebView(sessionId, webView)
                            }
                        }
                    } catch (e: Exception) {
                        Log.w(TAG, "⚠️ Failed to re-register WebView with sessionId", e)
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, "Failed to register WebView for session", e)
            }
        }

        Log.d(TAG, "✅ Found pending request, calling sendResponseToFrame")
        sendResponseToFrame(pending, response)
    }

    /**
     * Broadcast an event to all frames (main page + all iframes).
     *
     * Use this to notify the dApp about wallet state changes (e.g., disconnect).
     *
     * @param event The event data to broadcast
     */
    fun sendEvent(event: JSONObject) {
        Log.d(TAG, "🔔 sendEvent called")
        Log.d(TAG, "🔔 Event to send: $event")

        // CRITICAL FIX: The event from Engine already has the correct structure:
        // { type: "TONCONNECT_BRIDGE_EVENT", source: "...", event: {...} }
        // Extract the inner event
        val actualEvent = if (event.has(BrowserConstants.KEY_EVENT)) {
            event.getJSONObject(BrowserConstants.KEY_EVENT)
        } else {
            event
        }

        // Create the message structure for the event
        val eventMessage = JSONObject().apply {
            put(BrowserConstants.KEY_TYPE, BrowserConstants.MESSAGE_TYPE_BRIDGE_EVENT)
            put(BrowserConstants.KEY_EVENT, actualEvent)
        }

        Log.d(TAG, "🔔 Extracted actual event: $actualEvent")
        Log.d(TAG, "🔔 Formatted event message: $eventMessage")
        Log.d(TAG, "🔔 WebView attached: ${webView.parent != null}")

        // Store event in BridgeInterface - available to ALL frames via @JavascriptInterface
        bridgeInterface.storeEvent(eventMessage.toString())

        // Notify the main frame via JavaScript injection - main frame will broadcast to iframes via postMessage
        val script = """
            (function() {
                console.log('[Kotlin→JS] Event available');
                if (window.AndroidTonConnect && window.AndroidTonConnect.__notifyEvent) {
                    window.AndroidTonConnect.__notifyEvent();
                } else {
                    console.error('[Kotlin→JS] ❌ __notifyEvent not available!');
                }
            })();
        """.trimIndent()

        Log.d(TAG, "📤 Notifying main frame about event availability...")
        webView.post {
            webView.evaluateJavascript(script) { result ->
                Log.d(TAG, "📣 Event notification result: $result")
            }
        }
    }

    /**
     * Restores an existing TonConnect session for the given dApp URL.
     * When a user reopens the browser to a dApp they previously connected to,
     * this sends a "connect" event to restore the UI state.
     */
    private suspend fun restoreSessionIfExists(url: String) {
        try {
            Log.d(TAG, "🔍 Checking for existing session for URL: $url")

            // Get all sessions from the wallet
            val engine = engine ?: return
            val result = engine.callBridgeMethod(BridgeMethodConstants.METHOD_LIST_SESSIONS, JSONObject())
            val sessions = result?.optJSONArray(ResponseConstants.KEY_ITEMS) ?: return

            Log.d(TAG, "🔍 Found ${sessions.length()} total sessions")

            // Find a matching session for this dApp URL
            for (i in 0 until sessions.length()) {
                val session = sessions.getJSONObject(i)
                val sessionUrl = session.optString(ResponseConstants.KEY_DAPP_URL_ALT, MiscConstants.EMPTY_STRING)
                val sessionId = session.optString(ResponseConstants.KEY_SESSION_ID, MiscConstants.EMPTY_STRING)

                // Match by URL (normalize both by removing trailing slash and protocol)
                val normalizedDAppUrl =
                    sessionUrl.trim().trimEnd('/').removePrefix(MiscConstants.SCHEME_HTTPS).removePrefix(MiscConstants.SCHEME_HTTP)
                val normalizedCurrentUrl =
                    url.trim().trimEnd('/').removePrefix(MiscConstants.SCHEME_HTTPS).removePrefix(MiscConstants.SCHEME_HTTP)

                if (normalizedDAppUrl.isNotEmpty() && normalizedCurrentUrl.startsWith(normalizedDAppUrl)) {
                    Log.d(TAG, "✅ Found matching session: $sessionId for URL: $sessionUrl")

                    // Send a "connect" event to restore the UI
                    sendRestoreConnectionEvent(session)
                    return
                }
            }

            Log.d(TAG, "ℹ️ No existing session found for this URL")
        } catch (e: Exception) {
            Log.e(TAG, "Error restoring session", e)
        }
    }

    /**
     * Sends a "connect" event to the dApp to restore the connection UI state.
     * This makes the dApp show as connected when reopening to a previously connected dApp.
     */
    private fun sendRestoreConnectionEvent(session: JSONObject) {
        try {
            val sessionId = session.getString(ResponseConstants.KEY_SESSION_ID)
            val walletAddress = session.getString(ResponseConstants.KEY_WALLET_ADDRESS)
            val dAppName = session.optString(ResponseConstants.KEY_DAPP_NAME, ResponseConstants.VALUE_UNKNOWN_DAPP)

            Log.d(TAG, "📤 Sending restore connection event for session: $sessionId (dApp: $dAppName)")

            // Create a connect event payload matching the TonConnect spec
            val connectEvent = JSONObject().apply {
                put(BrowserConstants.KEY_EVENT, BrowserConstants.EVENT_CONNECT)
                put(ResponseConstants.KEY_ID, System.currentTimeMillis())
                put(
                    BrowserConstants.KEY_PAYLOAD,
                    JSONObject().apply {
                        // TODO: Replace default metadata with actual app info from configuration when available.
                        put(
                            JsonConstants.KEY_DEVICE,
                            JSONObject().apply {
                                put(JsonConstants.KEY_PLATFORM, WebViewConstants.PLATFORM_ANDROID)
                                put(JsonConstants.KEY_APP_NAME, BrowserConstants.DEFAULT_APP_NAME)
                                put(JsonConstants.KEY_APP_VERSION, BrowserConstants.DEFAULT_APP_VERSION)
                                put(JsonConstants.KEY_MAX_PROTOCOL_VERSION, NetworkConstants.MAX_PROTOCOL_VERSION)
                                put(
                                    JsonConstants.KEY_FEATURES,
                                    JSONArray().apply {
                                        put(
                                            JSONObject().apply {
                                                put(JsonConstants.KEY_NAME, JsonConstants.FEATURE_SEND_TRANSACTION)
                                                put(JsonConstants.KEY_MAX_MESSAGES, BrowserConstants.DEFAULT_MAX_MESSAGES)
                                            },
                                        )
                                        put(
                                            JSONObject().apply {
                                                put(JsonConstants.KEY_NAME, JsonConstants.FEATURE_SIGN_DATA)
                                                put(
                                                    JsonConstants.KEY_TYPES,
                                                    JSONArray().apply {
                                                        put(JsonConstants.VALUE_SIGN_DATA_TEXT)
                                                        put(JsonConstants.VALUE_SIGN_DATA_BINARY)
                                                        put(JsonConstants.VALUE_SIGN_DATA_CELL)
                                                    },
                                                )
                                            },
                                        )
                                    },
                                )
                            },
                        )
                        put(
                            ResponseConstants.KEY_ITEMS,
                            JSONArray().apply {
                                put(
                                    JSONObject().apply {
                                        put(JsonConstants.KEY_NAME, JsonConstants.VALUE_TON_ADDR_ITEM)
                                        put(ResponseConstants.KEY_ADDRESS, walletAddress)
                                        put(JsonConstants.KEY_NETWORK, TONNetwork.MAINNET.value)
                                        // Note: walletStateInit and publicKey would need to be fetched from storage
                                        // For now, the dApp can work with just the address for display purposes
                                    },
                                )
                            },
                        )
                    },
                )
            }

            // Reuse TonConnect event pipeline so every frame (including iframes) receives the restore event.
            Log.d(TAG, "🔔 Queueing connect event via BridgeInterface for session restore")
            sendEvent(
                JSONObject().apply {
                    put(BrowserConstants.KEY_EVENT, connectEvent)
                },
            )
        } catch (e: Exception) {
            Log.e(TAG, "Error sending restore connection event", e)
        }
    }

    /**
     * Clean up resources.
     *
     * This is called automatically when the WebView is detached from the window.
     * You can also call this manually if needed (e.g., when reusing a WebView),
     * but it's safe to call multiple times.
     */
    override fun cleanup() {
        if (isCleanedUp) {
            return // Already cleaned up
        }
        isCleanedUp = true

        Log.d(TAG, "Cleaning up TonConnect injector")

        // Unregister all sessions for this WebView
        // We need to iterate through all sessions and remove ones pointing to this WebView
        val sessionsToRemove = mutableListOf<String>()
        activeWebViews.forEach { (sessionId, webViewRef) ->
            if (webViewRef.get() == webView) {
                sessionsToRemove.add(sessionId)
            }
        }
        sessionsToRemove.forEach { sessionId ->
            unregisterWebView(sessionId)
        }

        // Remove attach state listener to prevent memory leak
        webView.removeOnAttachStateChangeListener(detachListener)

        scope.cancel()
        pendingRequests.clear()
        pendingResponses.clear()
    }

    private fun injectBridgeIntoAllFrames(webView: WebView?) {
        scope.launch {
            BridgeInjector.injectIntoAllFrames(
                context = context,
                webView = webView,
                onError = { error -> Log.e(TAG, "Bridge injection error: $error") },
            )
        }
    }

    private fun handleBridgeMessage(json: JSONObject, type: String) {
        scope.launch {
            when (type) {
                BrowserConstants.MESSAGE_TYPE_BRIDGE_REQUEST -> handleBridgeRequest(json)
                else -> Log.w(TAG, "Unknown message type: $type")
            }
        }
    }

    private fun handleBridgeRequest(json: JSONObject) {
        val frameId = json.optString(BrowserConstants.KEY_FRAME_ID, BrowserConstants.DEFAULT_FRAME_ID)
        val messageId = json.optString(BrowserConstants.KEY_MESSAGE_ID)
        val method = json.optString(BrowserConstants.KEY_METHOD, BrowserConstants.DEFAULT_METHOD)

        Log.d(TAG, "🟢 TonConnect request: frameId=$frameId, messageId=$messageId, method=$method")

        if (messageId.isEmpty()) {
            Log.e(TAG, "Bridge request missing messageId")
            return
        }

        // Store pending request with frame info
        val pending = PendingRequest(
            frameId = frameId,
            messageId = messageId,
            method = method,
            timestamp = System.currentTimeMillis(),
        )
        pendingRequests[messageId] = pending

        Log.d(TAG, "✅ Request stored: $method from '$frameId' (ID: $messageId)")

        // Get the engine from the provided TONWalletKit instance
        val engine = engine
        if (engine == null) {
            Log.e(TAG, "❌ WalletKit engine not available!")
            // Send error response back to dApp
            val errorResponse = JSONObject().apply {
                put(
                    ResponseConstants.KEY_ERROR,
                    JSONObject().apply {
                        put(ResponseConstants.KEY_MESSAGE, ERROR_WALLET_ENGINE_NOT_INITIALIZED)
                        put(ResponseConstants.KEY_CODE, ERROR_CODE_INTERNAL)
                    },
                )
            }
            sendResponse(messageId, errorResponse)
            return
        }

        // Emit browser bridge request event for UI tracking
        scope.launch {
            try {
                engine.callBridgeMethod(
                    method = BridgeMethodConstants.METHOD_EMIT_BROWSER_BRIDGE_REQUEST,
                    params = JSONObject().apply {
                        put(BrowserConstants.KEY_MESSAGE_ID, messageId)
                        put(BrowserConstants.KEY_METHOD, method)
                        put(BrowserConstants.KEY_REQUEST, json.toString())
                    },
                )
            } catch (e: Exception) {
                Log.w(TAG, "Failed to emit browser bridge request event", e)
            }
        }

        // Forward to TONWalletKit engine - it handles everything internally!
        scope.launch {
            try {
                Log.d(TAG, "🔄 Forwarding request to WalletKit engine: $method")

                // Get params - can be JSONObject, JSONArray, or null
                val paramsRaw = json.opt(ResponseConstants.KEY_PARAMS)

                // Convert to JSON string for engine (engine will parse it properly)
                val paramsJson: String? = when (paramsRaw) {
                    is JSONObject -> paramsRaw.toString()
                    is JSONArray -> paramsRaw.toString()
                    null -> null
                    else -> {
                        Log.w(TAG, "Unexpected params type: ${paramsRaw.javaClass.simpleName}")
                        null
                    }
                }

                Log.d(TAG, "🔄 Method: $method")
                Log.d(TAG, "🔄 Params JSON: $paramsJson")

                // Use WebView's current URL (the main frame URL) instead of tracking it manually
                // This is more reliable than trying to detect page vs resource loads
                Log.d(TAG, "🔄 webView.url = ${webView.url}")
                Log.d(TAG, "🔄 currentUrl = $currentUrl")
                val dAppUrl = webView.url ?: currentUrl
                Log.d(TAG, "🔄 Final dApp URL used: $dAppUrl")

                engine.handleTonConnectRequest(
                    messageId = messageId,
                    method = method,
                    paramsJson = paramsJson,
                    url = dAppUrl,
                    responseCallback = { response ->
                        Log.d(TAG, "🟣 responseCallback invoked by engine!")
                        Log.d(TAG, "🟣 Response for messageId: $messageId")
                        Log.d(TAG, "🟣 Response data: $response")
                        Log.d(TAG, "🟣 About to call sendResponse...")
                        sendResponse(messageId, response)
                        Log.d(TAG, "🟣 sendResponse call completed")
                    },
                )
                Log.d(TAG, "✅ Request forwarded successfully to WalletKit engine")
            } catch (e: Exception) {
                Log.e(TAG, "❌ Failed to forward request to WalletKit engine", e)
                // Send error response back to dApp
                val errorResponse = JSONObject().apply {
                    put(
                        ResponseConstants.KEY_ERROR,
                        JSONObject().apply {
                            put(ResponseConstants.KEY_MESSAGE, e.message ?: ERROR_FAILED_PROCESS_REQUEST)
                            put(ResponseConstants.KEY_CODE, ERROR_CODE_INTERNAL)
                        },
                    )
                }
                sendResponse(messageId, errorResponse)
            }
        }
    }

    private fun sendResponseToFrame(pending: PendingRequest, response: JSONObject) {
        Log.d(TAG, "📤 sendResponseToFrame called for messageId: ${pending.messageId}, method: ${pending.method}")
        Log.d(TAG, "📤 Response payload: $response")
        Log.d(TAG, "📤 WebView instance: $webView")
        Log.d(TAG, "📤 WebView parent: ${webView.parent}")

        // CRITICAL FIX: Queue responses if WebView is detached from window
        if (webView.parent == null) {
            Log.d(TAG, "⏸️ WebView detached - queueing response for ${pending.messageId}")
            pendingResponses[pending.messageId] = Pair(pending, response)
            return
        }

        // CRITICAL FIX: Don't use webView.post{} because the WebView may be detached
        // when showing wallet approval screens. Just execute directly - we're already
        // on the main thread via the responseCallback
        scope.launch(Dispatchers.Main) {
            Log.d(TAG, "📤 About to deliver response directly")
            deliverResponse(pending, response)
        }
    }

    private fun deliverResponse(pending: PendingRequest, response: JSONObject) {
        val responseJson = JSONObject().apply {
            put(BrowserConstants.KEY_TYPE, BrowserConstants.MESSAGE_TYPE_BRIDGE_RESPONSE)
            put(BrowserConstants.KEY_MESSAGE_ID, pending.messageId)
            put(BrowserConstants.KEY_SUCCESS, true)
            put(BrowserConstants.KEY_PAYLOAD, response)
        }

        Log.d(TAG, "📥 Storing response in BridgeInterface for messageId: ${pending.messageId}")
        Log.d(TAG, "📥 Frame ID: ${pending.frameId}")
        Log.d(TAG, "📥 Response JSON: $responseJson")
        Log.d(TAG, "📥 WebView attached: ${webView.parent != null}")

        // Store response in BridgeInterface - available to ALL frames via @JavascriptInterface
        bridgeInterface.storeResponse(pending.messageId, responseJson.toString())

        // Notify the main frame via JavaScript injection - main frame will broadcast to iframes via postMessage
        val script = """
            (function() {
                console.log('[Kotlin→JS] Response available for messageId: ${pending.messageId}');
                if (window.AndroidTonConnect && window.AndroidTonConnect.__notifyResponse) {
                    window.AndroidTonConnect.__notifyResponse('${pending.messageId}');
                } else {
                    console.error('[Kotlin→JS] ❌ __notifyResponse not available!');
                }
            })();
        """.trimIndent()

        Log.d(TAG, "📤 Notifying main frame about response availability...")
        webView.evaluateJavascript(script) { result ->
            Log.d(TAG, "📣 Notification result: $result")
        }
    }

    /**
     * Deliver all pending responses that were queued while the WebView was detached.
     * This is called when the WebView is re-attached to the window.
     */
    private fun deliverPendingResponses() {
        if (pendingResponses.isEmpty()) {
            Log.d(TAG, "📬 No pending responses to deliver")
            return
        }

        Log.d(TAG, "📬 Delivering ${pendingResponses.size} pending response(s)")

        scope.launch(Dispatchers.Main) {
            pendingResponses.forEach { (messageId, pair) ->
                val (pending, response) = pair
                Log.d(TAG, "📬 Delivering queued response for messageId: $messageId")
                deliverResponse(pending, response)
            }
            pendingResponses.clear()
            Log.d(TAG, "📬 All pending responses delivered")
        }
    }
}
