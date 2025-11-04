package io.ton.walletkit.browser

import android.webkit.WebChromeClient
import android.webkit.WebView
import io.ton.walletkit.internal.constants.BrowserConstants

/**
 * WebChromeClient that re-injects the bridge when page loads more content.
 * This handles dynamically created iframes.
 */
internal class TonConnectWebChromeClient(
    private val injectBridge: (webView: WebView?) -> Unit,
) : WebChromeClient() {

    override fun onProgressChanged(view: WebView?, newProgress: Int) {
        super.onProgressChanged(view, newProgress)
        // Re-inject when page is almost done loading (handles dynamic iframes)
        if (newProgress > BrowserConstants.WEBVIEW_INJECTION_PROGRESS_THRESHOLD) {
            injectBridge(view)
        }
    }
}
