package io.ton.walletkit.internal.constants

/**
 * Constants for reflection-based class loading.
 *
 * These constants define fully qualified class names used for reflective
 * instantiation of engine implementations, particularly for QuickJS support
 * in the full variant.
 *
 * @suppress Internal implementation constants. Not part of public API.
 */
internal object ReflectionConstants {
    /**
     * Fully qualified class name for QuickJsWalletKitEngine.
     *
     * Used for reflection-based loading in full variant AAR.
     */
    const val CLASS_QUICKJS_ENGINE = "io.ton.walletkit.presentation.impl.QuickJsWalletKitEngine"

    /**
     * Fully qualified class name for OkHttpClient.
     *
     * Used for reflection-based constructor parameter type matching.
     */
    const val CLASS_OKHTTP_CLIENT = "okhttp3.OkHttpClient"

    /**
     * Fully qualified class name for TONWalletKitConfiguration.
     *
     * Used for reflection-based constructor parameter type matching.
     */
    const val CLASS_TON_WALLET_KIT_CONFIGURATION = "io.ton.walletkit.config.TONWalletKitConfiguration"

    /**
     * Fully qualified class name for TONBridgeEventsHandler.
     *
     * Used for reflection-based constructor parameter type matching.
     */
    const val CLASS_TON_BRIDGE_EVENTS_HANDLER = "io.ton.walletkit.presentation.listener.TONBridgeEventsHandler"

    /**
     * Error message when QuickJS engine is not available.
     */
    const val ERROR_QUICKJS_NOT_AVAILABLE =
        "QuickJS engine is not available in this SDK variant. " +
            "Use the 'full' variant AAR to access QuickJS, or use WalletKitEngineKind.WEBVIEW instead."
}
