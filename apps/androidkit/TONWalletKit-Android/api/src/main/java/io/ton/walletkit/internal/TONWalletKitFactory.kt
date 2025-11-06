package io.ton.walletkit.internal

import android.content.Context
import io.ton.walletkit.ITONWalletKit
import io.ton.walletkit.config.TONWalletKitConfiguration
import kotlinx.coroutines.suspendCancellableCoroutine

/**
 * Internal factory for creating ITONWalletKit instances.
 * Uses reflection to load the implementation without compile-time dependency.
 *
 * @hide This is internal implementation detail and should not be used directly.
 */
@PublishedApi
internal object TONWalletKitFactory {
    @Suppress("UNCHECKED_CAST")
    suspend fun create(
        context: Context,
        config: TONWalletKitConfiguration,
    ): ITONWalletKit {
        // Load the implementation class via reflection to avoid compile-time dependency
        val implClass = Class.forName("io.ton.walletkit.TONWalletKit")

        // Get the Companion object
        val companionField = implClass.getDeclaredField("Companion")
        companionField.isAccessible = true
        val companion = companionField.get(null)

        // Get the initialize method from the Companion class
        val companionClass = companion.javaClass
        val method = companionClass.getDeclaredMethod(
            "initialize",
            Context::class.java,
            TONWalletKitConfiguration::class.java,
            kotlin.coroutines.Continuation::class.java,
        )
        method.isAccessible = true

        // Call as suspend function
        return suspendCancellableCoroutine { continuation ->
            try {
                method.invoke(companion, context, config, continuation)
            } catch (e: Exception) {
                continuation.resumeWith(Result.failure(e))
            }
        }
    }
}
