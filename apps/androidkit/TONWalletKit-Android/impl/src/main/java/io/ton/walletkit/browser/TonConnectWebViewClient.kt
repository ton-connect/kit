package io.ton.walletkit.browser

import android.graphics.Bitmap
import android.util.Log
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import io.ton.walletkit.internal.constants.BrowserConstants

/**
 * WebViewClient that handles page loading events and injects the TonConnect bridge.
 */
internal class TonConnectWebViewClient(
    private val onPageStarted: (url: String) -> Unit,
    private val onPageFinished: (url: String) -> Unit,
    private val onError: (message: String) -> Unit,
    private val injectBridge: (webView: WebView?) -> Unit,
    private val onTonConnectUrl: ((url: String) -> Unit)? = null,
    // Function to get the injection script
    private val getInjectionScript: () -> String,
) : WebViewClient() {

    private fun isTonConnectUrl(url: String): Boolean =
        url.startsWith(SCHEME_TC) ||
            url.startsWith(SCHEME_TONKEEPER) ||
            url.startsWith(SCHEME_TONKEEPER_SHORT) ||
            url.startsWith(BrowserConstants.URL_TONKEEPER_APP_TON_CONNECT) ||
            url.startsWith(BrowserConstants.URL_TONKEEPER_TON_CONNECT)

    override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
        val url = request?.url?.toString() ?: return false

        Log.d(TAG, "shouldOverrideUrlLoading: $url")

        // Intercept tc://, tonkeeper:// deep links AND https://app.tonkeeper.com/ton-connect URLs
        if (isTonConnectUrl(url)) {
            Log.d(TAG, "Intercepted TonConnect URL (preventing navigation, dApp should use injected bridge): $url")
            onTonConnectUrl?.invoke(url)
            return true // Prevent navigation - dApp should use injected bridge (embedded: true)
        }

        return super.shouldOverrideUrlLoading(view, request)
    }

    override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
        Log.d(TAG, "onPageStarted: $url")

        // Also intercept in onPageStarted as a safety net
        if (url != null && isTonConnectUrl(url)) {
            Log.d(TAG, "Intercepted TonConnect URL in onPageStarted (stopping load, dApp should use injected bridge): $url")
            onTonConnectUrl?.invoke(url)
            view?.stopLoading()
            return // Don't call callbacks
        }

        super.onPageStarted(view, url, favicon)

        // CRITICAL: Inject bridge BEFORE page JavaScript executes
        // This ensures iframe TonConnect SDKs detect our bridge instead of falling back to deep links
        injectBridge(view)

        url?.let {
            Log.d(TAG, "onPageStarted - URL: $it")
            onPageStarted(it)
        }
    }

    override fun onPageFinished(view: WebView?, url: String?) {
        super.onPageFinished(view, url)

        // Re-inject bridge after page finishes loading as a safety net
        // (in case any dynamic iframes were added after onPageStarted)
        injectBridge(view)

        url?.let {
            Log.d(TAG, "onPageFinished - URL: $it")
            onPageFinished(it)
        }
    }

    override fun onReceivedError(
        view: WebView?,
        request: WebResourceRequest?,
        error: android.webkit.WebResourceError?,
    ) {
        super.onReceivedError(view, request, error)
        val errorMessage = error?.description?.toString() ?: DEFAULT_ERROR_MESSAGE
        onError(errorMessage)
    }

    companion object {
        private const val TAG = "TonConnectWebViewClient"
        private const val DEFAULT_ERROR_MESSAGE = "Unknown error"

        // URL schemes for TonConnect deep links
        private const val SCHEME_TC = "tc://"
        private const val SCHEME_TONKEEPER = "tonkeeper://"
        private const val SCHEME_TONKEEPER_SHORT = "tonkeeper:"
    }
}
