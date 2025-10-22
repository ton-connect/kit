package io.ton.walletkit.presentation.browser

import android.annotation.SuppressLint
import android.content.Context
import android.util.Log
import android.webkit.WebView
import io.ton.walletkit.data.browser.PendingRequest
import io.ton.walletkit.domain.constants.BrowserConstants
import io.ton.walletkit.domain.constants.ResponseConstants
import io.ton.walletkit.presentation.WalletKitEngine
import io.ton.walletkit.presentation.browser.internal.BridgeInjector
import io.ton.walletkit.presentation.browser.internal.BridgeInterface
import io.ton.walletkit.presentation.browser.internal.TonConnectWebChromeClient
import io.ton.walletkit.presentation.browser.internal.TonConnectWebViewClient
import io.ton.walletkit.presentation.event.BrowserEvent
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.util.concurrent.ConcurrentHashMap

/**
 * Internal browser for dApps with TonConnect support.
 *
 * This WebView automatically injects the TonConnect bridge, allowing dApps
 * to connect to the wallet and send transaction requests.
 *
 * Implements window reference tracking to support iframes - responses are
 * sent back to the exact window/iframe that made the request.
 *
 * **Automatic Request Forwarding:**
 * When a dApp sends a TonConnect request (connect, transaction, etc.), this browser
 * automatically forwards it to the WalletKit engine for processing. The engine's
 * event handlers will receive the request, and responses are automatically routed
 * back to the correct iframe.
 *
 * Example:
 * ```kotlin
 * val browser = TONWalletKit.openDApp("https://app.ston.fi") { event ->
 *     when (event) {
 *         is BrowserEvent.PageStarted -> updateUI(event.url)
 *         is BrowserEvent.PageFinished -> hideLoading()
 *         is BrowserEvent.BridgeRequest -> {
 *             // Optional: show UI notification that request is being processed
 *             // The SDK automatically forwards this to WalletKit engine
 *         }
 *         is BrowserEvent.Error -> showError(event.message)
 *     }
 * }
 * ```
 *
 * @property context Android context
 * @property engine WalletKit engine instance for processing requests (internal)
 * @property eventListener Optional listener for browser events (page loads, errors, requests)
 */
class TONInternalBrowser internal constructor(
    private val context: Context,
    private val engine: WalletKitEngine?,
    private val eventListener: ((BrowserEvent) -> Unit)? = null,
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private var webView: WebView? = null

    // Track pending requests by messageId with their frameId for response routing
    private val pendingRequests = ConcurrentHashMap<String, PendingRequest>()

    /**
     * Open a URL in the internal browser.
     *
     * The browser will automatically inject TonConnect bridge support,
     * allowing the dApp to connect to the wallet.
     *
     * @param url URL to open
     */
    @SuppressLint("SetJavaScriptEnabled")
    fun open(url: String) {
        scope.launch {
            if (webView == null) {
                webView = createWebView()
            }
            webView?.loadUrl(url)
        }
    }

    /**
     * Get the underlying WebView for embedding in UI.
     *
     * @return WebView instance, or null if not yet created
     */
    fun getView(): WebView? = webView

    /**
     * Close the browser and clean up resources.
     */
    fun close() {
        scope.cancel()
        webView?.destroy()
        webView = null
        pendingRequests.clear()
    }

    /**
     * Send a response back to the frame that made the request.
     * This is called after WalletKit processes a request and generates a response.
     *
     * @param messageId The ID of the original request
     * @param response The response data from WalletKit
     */
    fun sendResponse(messageId: String, response: JSONObject) {
        val pending = pendingRequests.remove(messageId)
        if (pending == null) {
            Log.w(TAG, "No pending request found for messageId: $messageId")
            return
        }

        sendResponseToFrame(pending, response)
    }

    /**
     * Send an event to all frames (for unsolicited events like disconnect).
     *
     * @param event The event data to broadcast
     */
    fun sendEvent(event: JSONObject) {
        scope.launch {
            webView?.post {
                val eventJson = JSONObject().apply {
                    put(BrowserConstants.KEY_TYPE, BrowserConstants.MESSAGE_TYPE_BRIDGE_EVENT)
                    put(BrowserConstants.KEY_EVENT, event)
                }

                // Send to main frame
                webView?.evaluateJavascript(
                    """
                    ${BrowserConstants.JS_WINDOW_POST_MESSAGE}($eventJson, '*');
                    """.trimIndent(),
                    null,
                )

                // Send to all iframes
                webView?.evaluateJavascript(
                    """
                    (function() {
                        const iframes = document.querySelectorAll('${BrowserConstants.JS_SELECTOR_IFRAMES}');
                        for (const iframe of iframes) {
                            try {
                                iframe.${BrowserConstants.JS_PROPERTY_CONTENT_WINDOW}.postMessage($eventJson, '*');
                            } catch (e) {
                                // Cross-origin iframe, skip
                            }
                        }
                    })();
                    """.trimIndent(),
                    null,
                )
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun createWebView(): WebView {
        val view = WebView(context)

        view.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowContentAccess = true
            allowFileAccess = false
        }

        // Add JavaScript interface for bridge communication
        view.addJavascriptInterface(
            BridgeInterface(
                onMessage = { json, type -> handleBridgeMessage(json, type) },
                onError = { error -> eventListener?.invoke(BrowserEvent.Error(error)) },
            ),
            BrowserConstants.JS_INTERFACE_NAME,
        )

        view.webViewClient = TonConnectWebViewClient(
            onPageStarted = { url -> eventListener?.invoke(BrowserEvent.PageStarted(url)) },
            onPageFinished = { url -> eventListener?.invoke(BrowserEvent.PageFinished(url)) },
            onError = { error -> eventListener?.invoke(BrowserEvent.Error(error)) },
            injectBridge = { webView -> injectBridgeIntoAllFrames(webView) },
        )

        view.webChromeClient = TonConnectWebChromeClient(
            injectBridge = { webView -> injectBridgeIntoAllFrames(webView) },
        )

        return view
    }

    private fun injectBridgeIntoAllFrames(webView: WebView?) {
        scope.launch {
            BridgeInjector.injectIntoAllFrames(
                context = context,
                webView = webView,
                onError = { error -> eventListener?.invoke(BrowserEvent.Error(error)) },
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

    /**
     * Handle a bridge request from JavaScript.
     * Stores the request with its frameId for response routing, then automatically
     * forwards it to the WalletKit engine for processing.
     */
    private fun handleBridgeRequest(json: JSONObject) {
        val frameId = json.optString(BrowserConstants.KEY_FRAME_ID, BrowserConstants.DEFAULT_FRAME_ID)
        val messageId = json.optString(BrowserConstants.KEY_MESSAGE_ID)
        val method = json.optString(BrowserConstants.KEY_METHOD, BrowserConstants.DEFAULT_METHOD)

        Log.d(TAG, "🟢 handleBridgeRequest: frameId=$frameId, messageId=$messageId, method=$method")

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

        // Notify event listener (for UI updates, logging, etc.)
        eventListener?.invoke(
            BrowserEvent.BridgeRequest(
                messageId = messageId,
                method = method,
                request = json.toString(),
            ),
        )

        Log.d(TAG, "📢 Event listener notified for: $method")

        // Automatically forward to WalletKit engine for processing
        if (engine != null) {
            scope.launch {
                try {
                    Log.d(TAG, "🔄 Forwarding request to WalletKit engine: $method")

                    // Forward the request to the WalletKit engine's JavaScript bridge
                    // The engine will process it and trigger events through eventsHandler
                    engine.handleTonConnectRequest(
                        messageId = messageId,
                        method = method,
                        params = json.optJSONObject(ResponseConstants.KEY_PARAMS),
                        responseCallback = { response ->
                            Log.d(TAG, "✅ Engine processed request, sending response back to dApp")
                            // Engine processed the request, send response back to dApp
                            sendResponse(messageId, response)
                        },
                    )
                    Log.d(TAG, "✅ Request forwarded successfully to engine")
                } catch (e: Exception) {
                    Log.e(TAG, "❌ Failed to forward request to engine", e)
                    // Send error response back to dApp
                    val errorResponse = JSONObject().apply {
                        put(
                            ResponseConstants.KEY_ERROR,
                            JSONObject().apply {
                                put(ResponseConstants.KEY_MESSAGE, e.message ?: "Failed to process request")
                                put(ResponseConstants.KEY_CODE, 500)
                            },
                        )
                    }
                    sendResponse(messageId, errorResponse)
                }
            }
        } else {
            Log.w(TAG, "⚠️ No WalletKit engine available - request cannot be processed")
            // Send error response back to dApp
            val errorResponse = JSONObject().apply {
                put(
                    ResponseConstants.KEY_ERROR,
                    JSONObject().apply {
                        put(ResponseConstants.KEY_MESSAGE, "WalletKit not initialized")
                        put(ResponseConstants.KEY_CODE, 503)
                    },
                )
            }
            sendResponse(messageId, errorResponse)
        }
    }

    /**
     * Send a response back to the specific frame that made the request.
     */
    private fun sendResponseToFrame(pending: PendingRequest, response: JSONObject) {
        scope.launch {
            webView?.post {
                val responseJson = JSONObject().apply {
                    put(BrowserConstants.KEY_TYPE, BrowserConstants.MESSAGE_TYPE_BRIDGE_RESPONSE)
                    put(BrowserConstants.KEY_MESSAGE_ID, pending.messageId)
                    put(BrowserConstants.KEY_SUCCESS, true)
                    put(BrowserConstants.KEY_PAYLOAD, response)
                }

                Log.d(TAG, "Sending response to frame '${pending.frameId}' for ${pending.method} (ID: ${pending.messageId})")

                if (pending.frameId == BrowserConstants.DEFAULT_FRAME_ID) {
                    // Send to main window
                    webView?.evaluateJavascript(
                        """
                        ${BrowserConstants.JS_WINDOW_POST_MESSAGE}($responseJson, '*');
                        """.trimIndent(),
                        null,
                    )
                } else {
                    // Find iframe by frameId and send to it
                    webView?.evaluateJavascript(
                        """
                        (function() {
                            const iframes = document.querySelectorAll('${BrowserConstants.JS_SELECTOR_IFRAMES}');
                            for (const iframe of iframes) {
                                try {
                                    if (iframe.${BrowserConstants.JS_PROPERTY_CONTENT_WINDOW}.${BrowserConstants.JS_PROPERTY_FRAME_ID} === '${pending.frameId}') {
                                        iframe.${BrowserConstants.JS_PROPERTY_CONTENT_WINDOW}.postMessage($responseJson, '*');
                                        console.log('${BrowserConstants.CONSOLE_PREFIX_NATIVE} ${BrowserConstants.CONSOLE_MSG_RESPONSE_SENT} ${pending.frameId}');
                                        return;
                                    }
                                } catch (e) {
                                    // Cross-origin iframe, skip
                                }
                            }
                            console.warn('${BrowserConstants.CONSOLE_PREFIX_NATIVE} ${BrowserConstants.CONSOLE_MSG_FRAME_NOT_FOUND}: ${pending.frameId}');
                        })();
                        """.trimIndent(),
                        null,
                    )
                }
            }
        }
    }

    companion object {
        private const val TAG = "TONInternalBrowser"
    }
}
