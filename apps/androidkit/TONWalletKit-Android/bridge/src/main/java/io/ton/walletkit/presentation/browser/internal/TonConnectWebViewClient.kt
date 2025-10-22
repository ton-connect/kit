package io.ton.walletkit.presentation.browser.internal

import android.graphics.Bitmap
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient

/**
 * WebViewClient that handles page loading events and injects the TonConnect bridge.
 */
internal class TonConnectWebViewClient(
    private val onPageStarted: (url: String) -> Unit,
    private val onPageFinished: (url: String) -> Unit,
    private val onError: (message: String) -> Unit,
    private val injectBridge: (webView: WebView?) -> Unit,
) : WebViewClient() {

    override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
        super.onPageStarted(view, url, favicon)
        url?.let { onPageStarted(it) }
    }

    override fun onPageFinished(view: WebView?, url: String?) {
        super.onPageFinished(view, url)

        // Inject TonConnect bridge into main frame and all iframes
        injectBridge(view)

        url?.let { onPageFinished(it) }
    }

    override fun onReceivedError(
        view: WebView?,
        request: WebResourceRequest?,
        error: android.webkit.WebResourceError?,
    ) {
        super.onReceivedError(view, request, error)
        val errorMessage = error?.description?.toString() ?: "Unknown error"
        onError(errorMessage)
    }
}
