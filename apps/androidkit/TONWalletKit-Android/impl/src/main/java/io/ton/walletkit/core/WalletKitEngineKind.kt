package io.ton.walletkit.core

/**
 * Identifies which JavaScript runtime engine implementation is being used by the SDK.
 *
 * Internal implementation detail. SDK always uses WebView engine.
 *
 * @suppress
 */
internal enum class WalletKitEngineKind {
    /**
     * WebView-based JavaScript engine (recommended for all use cases).
     *
     * This engine uses Android's WebView component to execute the WalletKit
     * JavaScript bundle. It provides:
     * - 2x faster performance compared to QuickJS
     * - Active maintenance and updates
     * - Production-ready stability
     * - Available in all SDK variants (webview-only and full)
     */
    WEBVIEW,

    /**
     * QuickJS-based JavaScript engine (deprecated).
     *
     * This engine uses a native QuickJS runtime compiled for Android.
     * **Note:** This option is deprecated and should not be used for new projects.
     *
     * Limitations:
     * - 2x slower than WebView
     * - No longer actively maintained
     * - Only available in the 'full' SDK variant
     * - Larger AAR size due to native libraries
     *
     * @deprecated QuickJS is deprecated due to performance and maintenance concerns.
     *     Use [WEBVIEW] instead. See QUICKJS_DEPRECATION.md for migration guide.
     */
    @Deprecated(
        message = "QuickJS is deprecated. Use WEBVIEW instead for 2x better performance.",
        replaceWith = ReplaceWith("WalletKitEngineKind.WEBVIEW"),
        level = DeprecationLevel.WARNING,
    )
    QUICKJS,
}
