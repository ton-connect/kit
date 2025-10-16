package io.ton.walletkit.presentation

import android.content.Context
import io.ton.walletkit.domain.constants.ReflectionConstants
import io.ton.walletkit.domain.constants.WebViewConstants
import io.ton.walletkit.presentation.impl.WebViewWalletKitEngine

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
     * @return WalletKitEngine instance
     * @throws IllegalStateException if the requested engine is not available in this SDK variant
     *
     * @sample
     * ```kotlin
     * // Works with both webview-only and full SDK variants
     * val engine = WalletKitEngineFactory.create(context, WalletKitEngineKind.WEBVIEW)
     * ```
     */
    @Suppress("DEPRECATION") // QuickJS still supported in full variant
    fun create(context: Context, kind: WalletKitEngineKind = WalletKitEngineKind.WEBVIEW): WalletKitEngine {
        return when (kind) {
            WalletKitEngineKind.WEBVIEW -> {
                // WebViewWalletKitEngine is always available in all variants
                createWebViewEngine(context)
            }
            WalletKitEngineKind.QUICKJS -> {
                // QuickJsWalletKitEngine is only available in full variant
                createQuickJsEngine(context)
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

    private fun createWebViewEngine(context: Context): WalletKitEngine {
        // Direct instantiation - WebViewWalletKitEngine is in the same module
        return WebViewWalletKitEngine(context)
    }

    private fun createQuickJsEngine(context: Context): WalletKitEngine {
        try {
            // Use reflection only for QuickJS to avoid compile-time dependency in webview variant
            val clazz = Class.forName(ReflectionConstants.CLASS_QUICKJS_ENGINE)
            // QuickJsWalletKitEngine has additional constructor parameters with defaults
            // Try the primary constructor: (Context, String, OkHttpClient)
            try {
                val okHttpClientClass = Class.forName(ReflectionConstants.CLASS_OKHTTP_CLIENT)
                val constructor = clazz.getConstructor(Context::class.java, String::class.java, okHttpClientClass)
                // Use null for optional parameters to use defaults (Kotlin handles this via synthetic methods)
                // Actually, we need to invoke with actual default values
                val defaultAssetPath = WebViewConstants.DEFAULT_QUICKJS_ASSET_DIR
                val okHttpClientConstructor = okHttpClientClass.getConstructor()
                val defaultHttpClient = okHttpClientConstructor.newInstance()
                return constructor.newInstance(context, defaultAssetPath, defaultHttpClient) as WalletKitEngine
            } catch (_: NoSuchMethodException) {
                // Fallback: try single-arg constructor if it exists
                val constructor = clazz.getConstructor(Context::class.java)
                return constructor.newInstance(context) as WalletKitEngine
            }
        } catch (e: ClassNotFoundException) {
            throw IllegalStateException(
                ReflectionConstants.ERROR_QUICKJS_NOT_AVAILABLE,
                e,
            )
        }
    }
}
