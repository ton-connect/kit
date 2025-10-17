package io.ton.walletkit.presentation

import android.content.Context
import io.ton.walletkit.presentation.config.TONWalletKitConfiguration
import io.ton.walletkit.presentation.listener.TONBridgeEventsHandler

/**
 * Main entry point for TON Wallet Kit SDK.
 *
 * Mirrors the canonical TON Wallet Kit specification for cross-platform consistency.
 *
 * Initialize the SDK by calling [initialize] with your configuration
 * and event handler before using any other functionality.
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
 * TONWalletKit.initialize(context, config, eventsHandler)
 * ```
 */
object TONWalletKit {
    /**
     * Internal engine instance. Exposed for TONWallet class access.
     * @suppress
     */
    @JvmSynthetic
    internal var engine: WalletKitEngine? = null
        private set

    /**
     * Initialize TON Wallet Kit with configuration and event handler.
     *
     * This method must be called before using any other SDK functionality.
     * Calling it multiple times will have no effect (first call wins).
     *
     * **Event Handler:**
     * The provided event handler will receive all wallet events (connection requests,
     * transaction requests, sign data requests, disconnects). Implement the
     * [TONBridgeEventsHandler] interface to handle these events.
     *
     * **Usage Example:**
     * ```kotlin
     * TONWalletKit.initialize(
     *     context = context,
     *     configuration = config,
     *     eventsHandler = object : TONBridgeEventsHandler {
     *         override fun handle(event: TONWalletKitEvent) {
     *             when (event) {
     *                 is TONWalletKitEvent.ConnectRequest -> {
     *                     // Handle connection request
     *                     event.request.approve(walletAddress)
     *                 }
     *                 is TONWalletKitEvent.TransactionRequest -> {
     *                     // Handle transaction request
     *                     event.request.approve()
     *                 }
     *                 is TONWalletKitEvent.SignDataRequest -> {
     *                     // Handle sign data request
     *                     event.request.approve()
     *                 }
     *                 is TONWalletKitEvent.Disconnect -> {
     *                     // Handle disconnect
     *                 }
     *             }
     *         }
     *     }
     * )
     * ```
     *
     * @param context Android context (required for storage and WebView initialization)
     * @param configuration SDK configuration (network, manifest, bridge, features, storage)
     * @param eventsHandler Handler for SDK events (connections, transactions, sign data, disconnects)
     * @throws WalletKitBridgeException if initialization fails
     */
    suspend fun initialize(
        context: Context,
        configuration: TONWalletKitConfiguration,
        eventsHandler: TONBridgeEventsHandler,
    ) {
        if (engine != null) {
            return // Already initialized
        }

        // Create engine with configuration and events handler using the WebView implementation
        val newEngine = WalletKitEngineFactory.create(
            kind = WalletKitEngineKind.WEBVIEW,
            context = context,
            configuration = configuration,
            eventsHandler = eventsHandler,
        )

        engine = newEngine
    }

    /**
     * Shut down the Wallet Kit engine and release all resources.
     *
     * This is primarily useful for tests or when the hosting process is about
     * to terminate and wants to eagerly dispose the underlying WebView.
     */
    suspend fun shutdown() {
        val currentEngine = engine ?: return
        try {
            currentEngine.destroy()
        } finally {
            engine = null
        }
    }
}
