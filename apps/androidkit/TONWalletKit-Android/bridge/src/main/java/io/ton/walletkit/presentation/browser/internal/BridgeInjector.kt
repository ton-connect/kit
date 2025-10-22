package io.ton.walletkit.presentation.browser.internal

import android.content.Context
import android.util.Log
import android.webkit.WebView
import io.ton.walletkit.domain.constants.BrowserConstants

/**
 * Handles injection of the TonConnect bridge script into WebView frames.
 */
internal object BridgeInjector {
    private const val TAG = "BridgeInjector"

    /**
     * Inject the TonConnect bridge into the current frame and all iframes.
     * The inject.mjs script handles frame detection and registration automatically.
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

        // Inject into main frame
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

        // Inject into all iframes (for same-origin iframes)
        // The script will handle cross-origin detection
        webView.evaluateJavascript(
            """
            (function() {
                const iframes = document.querySelectorAll('${BrowserConstants.JS_SELECTOR_IFRAMES}');
                let injectedCount = 0;
                iframes.forEach((iframe) => {
                    try {
                        if (iframe.${BrowserConstants.JS_PROPERTY_CONTENT_WINDOW} && iframe.${BrowserConstants.JS_PROPERTY_CONTENT_DOCUMENT}) {
                            const script = iframe.${BrowserConstants.JS_PROPERTY_CONTENT_DOCUMENT}.createElement('script');
                            script.textContent = `$injectScript`;
                            iframe.${BrowserConstants.JS_PROPERTY_CONTENT_DOCUMENT}.head.appendChild(script);
                            injectedCount++;
                        }
                    } catch (e) {
                        // Cross-origin iframe, can't inject
                        console.log('${BrowserConstants.CONSOLE_PREFIX_NATIVE} ${BrowserConstants.CONSOLE_MSG_SKIPPED_CROSS_ORIGIN}:', iframe.src);
                    }
                });
                return injectedCount;
            })();
            """.trimIndent(),
        ) { result ->
            val count = result?.toIntOrNull() ?: 0
            if (count > 0) {
                Log.d(TAG, "Injected bridge into $count iframe(s)")
            } else {
                Log.d(TAG, "No same-origin iframes found on this page")
            }
        }
    }
}
