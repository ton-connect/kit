package io.ton.walletkit.browser

import android.content.Context
import android.util.Log
import android.webkit.WebView
import io.ton.walletkit.internal.constants.BrowserConstants

/**
 * Handles injection of the TonConnect bridge script into WebView frames.
 */
internal object BridgeInjector {
    private const val TAG = "BridgeInjector"

    /**
     * Inject the TonConnect bridge into the current frame.
     *
     * NOTE: Android WebView automatically makes JavaScript accessible to ALL frames
     * (main frame + all iframes) when using addJavascriptInterface() and evaluateJavascript().
     * We don't need to manually inject into each iframe - WebView handles this automatically!
     *
     * The script will be re-injected on every page navigation via WebViewClient.onPageFinished.
     */
    fun injectIntoAllFrames(
        context: Context,
        webView: WebView?,
        onError: (String) -> Unit,
    ) {
        webView ?: return

        // Load inject.mjs from assets
        val injectScript = try {
            context.assets.open(BrowserConstants.INJECT_SCRIPT_PATH)
                .bufferedReader()
                .use { it.readText() }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load inject.mjs", e)
            onError("Failed to load bridge script: ${e.message}")
            return
        }

        // Inject once - WebView automatically makes this available to all frames!
        // The script includes a guard to prevent double-injection.
        webView.evaluateJavascript(
            """
            (function() {
                try {
                    $injectScript
                } catch (e) {
                    console.error('${BrowserConstants.CONSOLE_PREFIX_NATIVE} ${BrowserConstants.CONSOLE_MSG_FAILED_TO_INJECT}:', e);
                }
            })();
            """.trimIndent(),
            null,
        )

        Log.d(TAG, "Bridge injected - automatically available to all frames (main + iframes)")
    }
}
