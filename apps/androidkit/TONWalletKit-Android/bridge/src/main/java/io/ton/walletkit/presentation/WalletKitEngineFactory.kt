package io.ton.walletkit.presentation

import android.content.Context
import io.ton.walletkit.domain.constants.ReflectionConstants
import io.ton.walletkit.domain.constants.WebViewConstants
import io.ton.walletkit.presentation.config.TONWalletKitConfiguration
import io.ton.walletkit.presentation.impl.WebViewWalletKitEngine
import io.ton.walletkit.presentation.listener.TONBridgeEventsHandler

/**
 * Internal factory for creating WalletKitEngine instances.
 * SDK always uses WebView engine.
 *
 * @suppress
 */
internal object WalletKitEngineFactory {
    /**
     * Create a WalletKitEngine instance for the specified kind.
     *
     * @param context Android application context
     * @param kind The engine kind to create (WEBVIEW or QUICKJS)
     * @param configuration SDK configuration
     * @param eventsHandler Optional handler for SDK events (can be added later via addEventsHandler)
     * @return WalletKitEngine instance
     * @throws IllegalStateException if the requested engine is not available in this SDK variant
     *
     * @sample
     * ```kotlin
     * // Works with both webview-only and full SDK variants
     * val engine = WalletKitEngineFactory.create(context, WalletKitEngineKind.WEBVIEW, config, handler)
     * ```
     */
    @Suppress("DEPRECATION") // QuickJS still supported in full variant
    suspend fun create(
        context: Context,
        kind: WalletKitEngineKind = WalletKitEngineKind.WEBVIEW,
        configuration: TONWalletKitConfiguration,
        eventsHandler: TONBridgeEventsHandler? = null,
    ): WalletKitEngine {
        return when (kind) {
            WalletKitEngineKind.WEBVIEW -> {
                // WebViewWalletKitEngine is always available in all variants
                createWebViewEngine(context, configuration, eventsHandler)
            }
            WalletKitEngineKind.QUICKJS -> {
                // QuickJsWalletKitEngine is only available in full variant
                createQuickJsEngine(context, configuration, eventsHandler)
            }
        }
    }

    /**
     * Check if a specific engine kind is available in the current SDK variant.
     *
     * @param kind The engine kind to check
     * @return true if the engine is available, false otherwise
     */
    fun isAvailable(kind: WalletKitEngineKind): Boolean {
        return when (kind) {
            WalletKitEngineKind.WEBVIEW -> true // Always available
            WalletKitEngineKind.QUICKJS -> {
                try {
                    // Check if QuickJS class exists (only in full variant)
                    Class.forName(ReflectionConstants.CLASS_QUICKJS_ENGINE)
                    true
                } catch (_: ClassNotFoundException) {
                    false
                }
            }
        }
    }

    private suspend fun createWebViewEngine(
        context: Context,
        configuration: TONWalletKitConfiguration,
        eventsHandler: TONBridgeEventsHandler?,
    ): WalletKitEngine {
        // CRITICAL: Use network-based caching to prevent multiple WebView instances per network
        // Multiple WebViews with the same JS bridge interface name will conflict
        // Different networks (mainnet/testnet) get separate WebView engines
        val engine = WebViewWalletKitEngine.getOrCreate(context, configuration, eventsHandler)
        // Initialize engine (starts WebView, loads bridge) - safe to call multiple times
        engine.init(configuration)
        return engine
    }

    private suspend fun createQuickJsEngine(
        context: Context,
        configuration: TONWalletKitConfiguration,
        eventsHandler: TONBridgeEventsHandler?,
    ): WalletKitEngine {
        try {
            // Use reflection only for QuickJS to avoid compile-time dependency in webview variant
            val clazz = Class.forName(ReflectionConstants.CLASS_QUICKJS_ENGINE)
            val configClass = Class.forName(ReflectionConstants.CLASS_TON_WALLET_KIT_CONFIGURATION)
            val eventsHandlerClass = Class.forName(ReflectionConstants.CLASS_TON_BRIDGE_EVENTS_HANDLER)
            val okHttpClientClass = Class.forName(ReflectionConstants.CLASS_OKHTTP_CLIENT)

            // QuickJsWalletKitEngine constructor: (Context, TONWalletKitConfiguration, TONBridgeEventsHandler, String, OkHttpClient)
            val constructor = clazz.getConstructor(
                Context::class.java,
                configClass,
                eventsHandlerClass,
                String::class.java,
                okHttpClientClass,
            )

            val defaultAssetPath = WebViewConstants.DEFAULT_QUICKJS_ASSET_DIR
            val okHttpClientConstructor = okHttpClientClass.getConstructor()
            val defaultHttpClient = okHttpClientConstructor.newInstance()

            val engine = constructor.newInstance(
                context,
                configuration,
                eventsHandler,
                defaultAssetPath,
                defaultHttpClient,
            ) as WalletKitEngine

            // Initialize engine
            engine.init(configuration)
            return engine
        } catch (e: ClassNotFoundException) {
            throw IllegalStateException(
                ReflectionConstants.ERROR_QUICKJS_NOT_AVAILABLE,
                e,
            )
        }
    }
}
