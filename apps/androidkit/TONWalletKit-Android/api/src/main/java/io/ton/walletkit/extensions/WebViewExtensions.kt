package io.ton.walletkit.extensions

import android.webkit.WebView
import io.ton.walletkit.ITONWalletKit
import io.ton.walletkit.WebViewTonConnectInjector

/**
 * Extension functions for adding TonConnect support to any WebView.
 *
 * These extensions make it easy to integrate TonConnect into existing WebView-based applications.
 */

private const val TAG_TON_CONNECT_INJECTOR = "tonconnect_injector"

/**
 * Inject TonConnect bridge into this WebView.
 *
 * This method adds TonConnect support to the WebView, enabling dApps to connect
 * with the wallet and request transactions/signatures. All requests are automatically
 * routed to the provided TONWalletKit instance which handles them internally.
 *
 * **Automatic Cleanup**: Resources are automatically cleaned up when the WebView is
 * detached from the window hierarchy. No manual cleanup is required.
 *
 * Example usage:
 * ```kotlin
 * val webView = WebView(context)
 * webView.settings.javaScriptEnabled = true
 *
 * // Inject TonConnect - that's it!
 * webView.injectTonConnect(walletKit)
 *
 * // Load your dApp
 * webView.loadUrl("https://demo.tonconnect.dev")
 *
 * // Cleanup happens automatically when WebView is destroyed
 * ```
 *
 * @param walletKit TONWalletKit instance to route requests to
 */
fun WebView.injectTonConnect(walletKit: ITONWalletKit) {
    // Check if injector already exists - don't recreate if it's already set up
    val existingInjector = getTag(TAG_TON_CONNECT_INJECTOR.hashCode()) as? WebViewTonConnectInjector
    if (existingInjector != null) {
        // Injector already exists, no need to recreate
        return
    }

    val injector = walletKit.createWebViewInjector(this)
    injector.setup()

    // Store injector in WebView tag for later access
    setTag(TAG_TON_CONNECT_INJECTOR.hashCode(), injector)
}

/**
 * Clean up TonConnect resources for this WebView.
 * Should be called when the WebView is no longer needed.
 */
fun WebView.cleanupTonConnect() {
    val injector = getTag(TAG_TON_CONNECT_INJECTOR.hashCode()) as? WebViewTonConnectInjector
    injector?.cleanup()
    setTag(TAG_TON_CONNECT_INJECTOR.hashCode(), null)
}
