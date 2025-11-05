package io.ton.walletkit.engine

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.webkit.WebViewAssetLoader
import io.ton.walletkit.WalletKitBridgeException
import io.ton.walletkit.internal.constants.LogConstants
import io.ton.walletkit.internal.constants.MiscConstants
import io.ton.walletkit.internal.constants.ResponseConstants
import io.ton.walletkit.internal.constants.WebViewConstants
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONException
import org.json.JSONObject

/**
 * Owns the WebView lifecycle, asset loading, and JavaScript bridge integration.
 *
 * The manager mirrors the legacy inline implementation to ensure behaviour (including logging)
 * remains unchanged while allowing the rest of the engine to interact through a focused API.
 *
 * @suppress Internal component. Use through [WebViewWalletKitEngine].
 */
internal class WebViewManager(
    context: Context,
    private val assetPath: String,
    private val storageManager: StorageManager,
    private val onMessage: (JSONObject) -> Unit,
    private val onBridgeError: (WalletKitBridgeException) -> Unit,
) {
    private val appContext = context.applicationContext
    private val assetLoader =
        WebViewAssetLoader
            .Builder()
            .setDomain(WebViewConstants.ASSET_LOADER_DOMAIN)
            .addPathHandler(WebViewConstants.ASSET_LOADER_PATH, WebViewAssetLoader.AssetsPathHandler(appContext))
            .build()
    private val mainHandler = Handler(Looper.getMainLooper())
    private lateinit var webView: WebView

    val webViewInitialized = CompletableDeferred<Unit>()
    val bridgeLoaded = CompletableDeferred<Unit>()
    val jsBridgeReady = CompletableDeferred<Unit>()

    init {
        if (Looper.myLooper() == Looper.getMainLooper()) {
            initializeWebView()
        } else {
            mainHandler.post { initializeWebView() }
        }
    }

    fun getMainHandler(): Handler = mainHandler

    fun attachTo(parent: ViewGroup) {
        if (::webView.isInitialized && webView.parent !== parent) {
            (webView.parent as? ViewGroup)?.removeView(webView)
            parent.addView(webView)
        }
    }

    fun asView(): WebView = webView

    suspend fun executeJavaScript(script: String) {
        webViewInitialized.await()
        withContext(Dispatchers.Main) {
            webView.evaluateJavascript(script, null)
        }
    }

    fun destroy() {
        if (!::webView.isInitialized) return
        (webView.parent as? ViewGroup)?.removeView(webView)
        webView.removeJavascriptInterface(WebViewConstants.JS_INTERFACE_NAME)
        webView.stopLoading()
        webView.destroy()
    }

    fun startJsBridgeReadyPolling() {
        if (jsBridgeReady.isCompleted) {
            return
        }
        mainHandler.post { pollJsBridgeReady() }
    }

    fun markJsBridgeReady() {
        if (!jsBridgeReady.isCompleted) {
            jsBridgeReady.complete(Unit)
        }
    }

    private fun initializeWebView() {
        try {
            Log.d(TAG, "Initializing WebView on thread: ${Thread.currentThread().name}")
            webView = WebView(appContext)
            WebView.setWebContentsDebuggingEnabled(true)
            webView.settings.javaScriptEnabled = true
            webView.settings.domStorageEnabled = true
            webView.settings.cacheMode = WebSettings.LOAD_NO_CACHE
            webView.settings.allowFileAccess = true
            webView.addJavascriptInterface(JsBinding(), WebViewConstants.JS_INTERFACE_NAME)
            webView.webViewClient =
                object : WebViewClient() {
                    override fun onReceivedError(
                        view: WebView?,
                        request: WebResourceRequest?,
                        error: WebResourceError?,
                    ) {
                        super.onReceivedError(view, request, error)
                        val description = error?.description?.toString() ?: ResponseConstants.VALUE_UNKNOWN
                        val failingUrl = request?.url?.toString()
                        Log.e(TAG, WebViewConstants.ERROR_WEBVIEW_LOAD_PREFIX + description + MSG_URL_SEPARATOR + (failingUrl ?: ResponseConstants.VALUE_UNKNOWN))
                        if (request?.isForMainFrame == true) {
                            val exception =
                                WalletKitBridgeException(
                                    WebViewConstants.ERROR_BUNDLE_LOAD_FAILED + MSG_OPEN_PAREN + description + MSG_CLOSE_PAREN_PERIOD_SPACE + WebViewConstants.BUILD_INSTRUCTION,
                                )
                            failBridgeFutures(exception)
                            onBridgeError(exception)
                        }
                    }

                    override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                        super.onPageStarted(view, url, favicon)
                        Log.d(TAG, "WebView page started loading: $url")
                    }

                    override fun onPageFinished(view: WebView?, url: String?) {
                        super.onPageFinished(view, url)
                        Log.d(TAG, "WebView page finished loading: $url")
                        if (!bridgeLoaded.isCompleted) {
                            bridgeLoaded.complete(Unit)
                        }
                        startJsBridgeReadyPolling()
                    }

                    override fun shouldInterceptRequest(
                        view: WebView?,
                        request: WebResourceRequest?,
                    ): WebResourceResponse? {
                        val url = request?.url ?: return super.shouldInterceptRequest(view, request)
                        Log.d(TAG, "WebView intercepting request: $url")
                        return assetLoader.shouldInterceptRequest(url)
                            ?: super.shouldInterceptRequest(view, request)
                    }
                }
            val safeAssetPath = assetPath.trimStart('/')
            val fullUrl = WebViewConstants.URL_PREFIX_HTTPS + WebViewConstants.ASSET_LOADER_DOMAIN + WebViewConstants.ASSET_LOADER_PATH + safeAssetPath
            Log.d(TAG, "Loading WebView URL: $fullUrl")
            webView.loadUrl(fullUrl)
            Log.d(TAG, "WebView initialization completed, webViewInitialized completing")
            webViewInitialized.complete(Unit)
        } catch (e: Exception) {
            Log.e(TAG, MSG_FAILED_INITIALIZE_WEBVIEW, e)
            webViewInitialized.completeExceptionally(e)
            bridgeLoaded.completeExceptionally(e)
            jsBridgeReady.completeExceptionally(e)
            onBridgeError(
                WalletKitBridgeException(
                    WebViewConstants.ERROR_BUNDLE_LOAD_FAILED + MSG_OPEN_PAREN + (e.message ?: ResponseConstants.VALUE_UNKNOWN) + MSG_CLOSE_PAREN_PERIOD_SPACE + WebViewConstants.BUILD_INSTRUCTION,
                ),
            )
        }
    }

    private fun pollJsBridgeReady() {
        if (jsBridgeReady.isCompleted) {
            return
        }
        try {
            webView.evaluateJavascript(WebViewConstants.JS_BRIDGE_READY_CHECK) { result ->
                val normalized = result?.trim()?.trim('"') ?: MiscConstants.EMPTY_STRING
                if (normalized.equals(WebViewConstants.JS_BOOLEAN_TRUE, ignoreCase = true)) {
                    markJsBridgeReady()
                } else {
                    mainHandler.postDelayed({ pollJsBridgeReady() }, WebViewConstants.JS_BRIDGE_POLL_DELAY_MS)
                }
            }
        } catch (err: Throwable) {
            Log.e(TAG, MSG_FAILED_EVALUATE_JS_BRIDGE, err)
            val safeMessage = err.message ?: ResponseConstants.VALUE_UNKNOWN
            val exception =
                WalletKitBridgeException(
                    WebViewConstants.ERROR_BUNDLE_LOAD_FAILED + MSG_OPEN_PAREN + safeMessage + MSG_CLOSE_PAREN_PERIOD_SPACE + WebViewConstants.BUILD_INSTRUCTION,
                )
            failBridgeFutures(exception)
            onBridgeError(exception)
        }
    }

    private fun failBridgeFutures(exception: WalletKitBridgeException) {
        if (!bridgeLoaded.isCompleted) {
            bridgeLoaded.completeExceptionally(exception)
        }
        if (!jsBridgeReady.isCompleted) {
            jsBridgeReady.completeExceptionally(exception)
        }
    }

    private inner class JsBinding {
        @JavascriptInterface
        fun postMessage(json: String) {
            try {
                Log.d(TAG, "📨 JsBinding.postMessage received from JS")
                Log.d(TAG, "📨 Thread: ${Thread.currentThread().name}")
                Log.v(TAG, "📨 Raw JSON: $json")

                val payload = JSONObject(json)
                onMessage(payload)
            } catch (err: JSONException) {
                Log.e(TAG, "❌ " + LogConstants.MSG_MALFORMED_PAYLOAD, err)
                onBridgeError(WalletKitBridgeException(LogConstants.ERROR_MALFORMED_PAYLOAD_PREFIX + err.message))
            }
        }

        @JavascriptInterface
        fun storageGet(key: String): String? {
            return kotlinx.coroutines.runBlocking {
                storageManager.get(key)
            }
        }

        @JavascriptInterface
        fun storageSet(
            key: String,
            value: String,
        ) {
            kotlinx.coroutines.runBlocking {
                storageManager.set(key, value)
            }
        }

        @JavascriptInterface
        fun storageRemove(key: String) {
            kotlinx.coroutines.runBlocking {
                storageManager.remove(key)
            }
        }

        @JavascriptInterface
        fun storageClear() {
            kotlinx.coroutines.runBlocking {
                storageManager.clear()
            }
        }
    }

    private companion object {
        private const val TAG = LogConstants.TAG_WEBVIEW_ENGINE
        private const val MSG_FAILED_INITIALIZE_WEBVIEW = "Failed to initialize WebView"
        private const val MSG_FAILED_EVALUATE_JS_BRIDGE = "Failed to evaluate JS bridge readiness"
        private const val MSG_URL_SEPARATOR = " url="
        private const val MSG_OPEN_PAREN = " ("
        private const val MSG_CLOSE_PAREN_PERIOD_SPACE = "). "
    }
}
