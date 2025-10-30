package io.ton.walletkit.presentation

import android.content.Context
import io.ton.walletkit.presentation.config.TONWalletKitConfiguration
import io.ton.walletkit.presentation.listener.TONBridgeEventsHandler

/**
 * Main entry point for TON Wallet Kit SDK.
 *
 * Mirrors the canonical TON Wallet Kit specification for cross-platform consistency.
 *
 * Initialize the SDK by calling [initialize] with your configuration.
 * Then add event handlers using [addEventsHandler] when you're ready to receive events.
 *
 * **Important:** Unlike a singleton, each TONWalletKit instance is independent. When you're done
 * with an instance, call [destroy] or let it go out of scope to clean up resources and stop
 * receiving events.
 *
 * Example:
 * ```kotlin
 * val config = TONWalletKitConfiguration(
 *     network = TONNetwork.MAINNET,
 *     walletManifest = TONWalletKitConfiguration.Manifest(
 *         name = "My TON Wallet",
 *         appName = "Wallet",
 *         imageUrl = "https://example.com/icon.png",
 *         aboutUrl = "https://example.com",
 *         universalLink = "https://example.com/tc",
 *         bridgeUrl = "https://bridge.tonapi.io/bridge"
 *     ),
 *     bridge = TONWalletKitConfiguration.Bridge(
 *         bridgeUrl = "https://bridge.tonapi.io/bridge"
 *     ),
 *     features = listOf(
 *         TONWalletKitConfiguration.SendTransactionFeature(maxMessages = 4),
 *         TONWalletKitConfiguration.SignDataFeature(
 *             types = listOf(SignDataType.TEXT, SignDataType.BINARY, SignDataType.CELL)
 *         )
 *     ),
 *     storage = TONWalletKitConfiguration.Storage(persistent = true)
 * )
 *
 * // Initialize SDK (returns instance)
 * val kit = TONWalletKit.initialize(context, config)
 *
 * // Later, add event handler when ready
 * val handler = object : TONBridgeEventsHandler {
 *     override fun handle(event: TONWalletKitEvent) {
 *         // Handle events
 *     }
 * }
 * kit.addEventsHandler(handler)
 *
 * // When done, destroy to stop receiving events and clean up
 * kit.destroy()
 * // or let kit = null (will auto-cleanup)
 * ```
 */
class TONWalletKit private constructor(
    /**
     * Internal engine instance. Exposed for TONWallet class access.
     * @suppress
     */
    @JvmSynthetic
    internal val engine: WalletKitEngine
) {
    @Volatile
    private var isDestroyed = false

    /**
     * Add an event handler to receive SDK events.
     *
     * This method can be called after initialization to start receiving events.
     * Multiple handlers can be added, and each will receive all events.
     * Events that occurred before the handler was added will be replayed if they
     * are still in the durable events queue.
     *
     * @param eventsHandler Handler for SDK events (connections, transactions, sign data, disconnects)
     * @throws IllegalStateException if SDK instance has been destroyed
     */
    suspend fun addEventsHandler(eventsHandler: TONBridgeEventsHandler) {
        checkNotDestroyed()
        engine.addEventsHandler(eventsHandler)
    }

    /**
     * Remove a previously added event handler.
     *
     * @param eventsHandler Handler to remove
     */
    suspend fun removeEventsHandler(eventsHandler: TONBridgeEventsHandler) {
        if (isDestroyed) return
        engine.removeEventsHandler(eventsHandler)
    }

    /**
     * Shut down the Wallet Kit instance and release all resources.
     *
     * This removes all event handlers, stops the WebView engine, and ensures
     * no more events will be received. After calling this, the instance cannot
     * be reused.
     *
     * This is called automatically when the instance is garbage collected.
     */
    suspend fun destroy() {
        if (isDestroyed) return
        
        isDestroyed = true
        
        try {
            engine.destroy()
        } catch (e: Exception) {
            // Log but don't throw - cleanup should be best-effort
        }
    }

    private fun checkNotDestroyed() {
        if (isDestroyed) {
            throw IllegalStateException("TONWalletKit instance has been destroyed. Create a new instance.")
        }
    }

    // === Wallet Management Methods (matching iOS API) ===

    /**
     * Add a new wallet from mnemonic data.
     *
     * @param data Wallet creation data (mnemonic, name, version, network)
     * @return The newly created wallet
     */
    suspend fun addWallet(data: io.ton.walletkit.domain.model.TONWalletData): TONWallet {
        checkNotDestroyed()
        
        val account = engine.addWalletFromMnemonic(
            words = data.mnemonic,
            name = data.name,
            version = data.version,
            network = data.network.value,
        )

        return TONWallet(
            address = account.address,
            engine = engine,
            account = account,
        )
    }

    /**
     * Get all wallets managed by this SDK instance.
     *
     * @return List of all wallets
     */
    suspend fun getWallets(): List<TONWallet> {
        checkNotDestroyed()
        
        val accounts = engine.getWallets()
        return accounts.map { account ->
            TONWallet(
                address = account.address,
                engine = engine,
                account = account,
            )
        }
    }

    companion object {
        /**
         * Initialize TON Wallet Kit with configuration.
         *
         * See class-level documentation for usage examples.
         */
        suspend fun initialize(
            context: Context,
            configuration: TONWalletKitConfiguration,
        ): TONWalletKit {
            // Create engine with configuration using the WebView implementation
            val newEngine = WalletKitEngineFactory.create(
                kind = WalletKitEngineKind.WEBVIEW,
                context = context,
                configuration = configuration,
                eventsHandler = null, // Event handlers are added on-demand
            )

            return TONWalletKit(newEngine)
        }
    }
}
