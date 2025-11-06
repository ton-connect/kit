package io.ton.walletkit.core

import android.content.Context
import android.util.Base64
import android.webkit.WebView
import io.ton.walletkit.ITONWallet
import io.ton.walletkit.ITONWalletKit
import io.ton.walletkit.WebViewTonConnectInjector
import io.ton.walletkit.browser.TonConnectInjector
import io.ton.walletkit.config.TONWalletKitConfiguration
import io.ton.walletkit.engine.WalletKitEngine
import io.ton.walletkit.internal.constants.ResponseConstants
import io.ton.walletkit.listener.TONBridgeEventsHandler
import io.ton.walletkit.model.SignDataResult
import io.ton.walletkit.model.TONNetwork
import io.ton.walletkit.model.TONWalletData
import io.ton.walletkit.model.WalletSigner
import org.json.JSONObject

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
internal class TONWalletKit private constructor(
    /**
     * Internal engine instance. Exposed for TONWallet class access.
     * @suppress
     */
    @JvmSynthetic
    internal val engine: WalletKitEngine,
) : ITONWalletKit {
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
    override suspend fun addEventsHandler(eventsHandler: TONBridgeEventsHandler) {
        checkNotDestroyed()
        engine.addEventsHandler(eventsHandler)
    }

    /**
     * Remove a previously added event handler.
     *
     * @param eventsHandler Handler to remove
     */
    override suspend fun removeEventsHandler(eventsHandler: TONBridgeEventsHandler) {
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
    override suspend fun destroy() {
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

    // === Wallet Management Methods ===

    /**
     * Create a new V4R2 wallet from mnemonic phrase.
     * If mnemonic is null, a new random mnemonic will be generated.
     *
     * @param mnemonic 24-word mnemonic phrase, or null to generate a new one
     * @param network Network to use (MAINNET or TESTNET)
     * @return The newly created wallet
     */
    override suspend fun createV4R2WalletFromMnemonic(
        mnemonic: List<String>?,
        network: TONNetwork,
    ): ITONWallet {
        checkNotDestroyed()

        val account = engine.createV4R2WalletFromMnemonic(
            mnemonic = mnemonic,
            network = network.value,
        )

        return TONWallet(
            address = account.address,
            engine = engine,
            account = account,
        )
    }

    /**
     * Create a new V5R1 wallet from mnemonic phrase.
     * If mnemonic is null, a new random mnemonic will be generated.
     *
     * @param mnemonic 24-word mnemonic phrase, or null to generate a new one
     * @param network Network to use (MAINNET or TESTNET)
     * @return The newly created wallet
     */
    override suspend fun createV5R1WalletFromMnemonic(
        mnemonic: List<String>?,
        network: TONNetwork,
    ): ITONWallet {
        checkNotDestroyed()

        val account = engine.createV5R1WalletFromMnemonic(
            mnemonic = mnemonic,
            network = network.value,
        )

        return TONWallet(
            address = account.address,
            engine = engine,
            account = account,
        )
    }

    /**
     * Create a new V4R2 wallet from secret key (private key).
     *
     * @param secretKey 32-byte secret key
     * @param network Network to use (MAINNET or TESTNET)
     * @return The newly created wallet
     */
    override suspend fun createV4R2WalletFromSecretKey(
        secretKey: ByteArray,
        network: TONNetwork,
    ): ITONWallet {
        checkNotDestroyed()

        val account = engine.createV4R2WalletFromSecretKey(
            secretKey = secretKey,
            network = network.value,
        )

        return TONWallet(
            address = account.address,
            engine = engine,
            account = account,
        )
    }

    /**
     * Create a new V5R1 wallet from secret key (private key).
     *
     * @param secretKey 32-byte secret key
     * @param network Network to use (MAINNET or TESTNET)
     * @return The newly created wallet
     */
    override suspend fun createV5R1WalletFromSecretKey(
        secretKey: ByteArray,
        network: TONNetwork,
    ): ITONWallet {
        checkNotDestroyed()

        val account = engine.createV5R1WalletFromSecretKey(
            secretKey = secretKey,
            network = network.value,
        )

        return TONWallet(
            address = account.address,
            engine = engine,
            account = account,
        )
    }

    /**
     * Create a new V4R2 wallet with an external signer.
     *
     * @param signer External wallet signer interface
     * @param network Network to use (MAINNET or TESTNET)
     * @return The newly created wallet
     */
    override suspend fun createV4R2WalletWithSigner(
        signer: WalletSigner,
        network: TONNetwork,
    ): ITONWallet {
        checkNotDestroyed()

        val account = engine.createV4R2WalletWithSigner(
            signer = signer,
            network = network.value,
        )

        return TONWallet(
            address = account.address,
            engine = engine,
            account = account,
        )
    }

    /**
     * Create a new V5R1 wallet with an external signer.
     *
     * @param signer External wallet signer interface
     * @param network Network to use (MAINNET or TESTNET)
     * @return The newly created wallet
     */
    override suspend fun createV5R1WalletWithSigner(
        signer: WalletSigner,
        network: TONNetwork,
    ): ITONWallet {
        checkNotDestroyed()

        val account = engine.createV5R1WalletWithSigner(
            signer = signer,
            network = network.value,
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
    override suspend fun getWallets(): List<ITONWallet> {
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

    /**
     * Derive a public key from a mnemonic without creating a wallet.
     */
    override suspend fun derivePublicKey(mnemonic: List<String>): String {
        checkNotDestroyed()
        return engine.derivePublicKeyFromMnemonic(mnemonic)
    }

    /**
     * Sign data with a mnemonic (for custom signers).
     */
    override suspend fun signDataWithMnemonic(
        mnemonic: List<String>,
        data: ByteArray,
        mnemonicType: String,
    ): SignDataResult {
        checkNotDestroyed()
        val signatureBytes = engine.signDataWithMnemonic(mnemonic, data, mnemonicType)
        val signatureBase64 = Base64.encodeToString(signatureBytes, Base64.NO_WRAP)
        return SignDataResult(signature = signatureBase64)
    }

    /**
     * Handle a new transaction initiated from the wallet app.
     *
     * This method takes transaction content (created via wallet.createTransferTonTransaction,
     * wallet.transferJettonTransaction, etc.) and triggers the transaction approval flow.
     *
     * Matches the JS WalletKit API:
     * ```typescript
     * const tx = await wallet.createTransferTonTransaction(params);
     * await kit.handleNewTransaction(wallet, tx);
     * // This triggers onTransactionRequest event
     * ```
     *
     * The transaction will appear as a TransactionRequestEvent that can be approved or rejected
     * via the event handler.
     *
     * @param wallet The wallet that will sign and send the transaction
     * @param transactionContent Transaction content as JSON string (from createTransferTonTransaction, etc.)
     * @throws io.ton.walletkit.WalletKitBridgeException if transaction handling fails
     */
    override suspend fun handleNewTransaction(wallet: ITONWallet, transactionContent: String) {
        checkNotDestroyed()
        val addr = wallet.address ?: throw IllegalArgumentException("Wallet address is null")
        engine.handleNewTransaction(addr, transactionContent)
    }

    /**
     * Disconnect a TON Connect session by session ID.
     *
     * @param sessionId The ID of the session to disconnect
     * @throws io.ton.walletkit.WalletKitBridgeException if session disconnection fails
     */
    override suspend fun disconnectSession(sessionId: String) {
        checkNotDestroyed()
        engine.disconnectSession(sessionId)
    }

    /**
     * Create a WebView TonConnect injector for the given WebView.
     *
     * @param webView The WebView to inject TonConnect into
     * @return A WebViewTonConnectInjector that can setup and cleanup TonConnect
     */
    override fun createWebViewInjector(webView: WebView): WebViewTonConnectInjector {
        return TonConnectInjector(webView, this)
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
        ): ITONWalletKit {
            // Create engine with configuration using the WebView implementation
            val newEngine = WalletKitEngineFactory.create(
                kind = WalletKitEngineKind.WEBVIEW,
                context = context,
                configuration = configuration,
                eventsHandler = null,
            )

            return TONWalletKit(newEngine)
        }
    }
}
