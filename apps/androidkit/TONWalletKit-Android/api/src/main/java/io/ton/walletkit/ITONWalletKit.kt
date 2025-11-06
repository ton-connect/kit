package io.ton.walletkit

import android.content.Context
import io.ton.walletkit.config.TONWalletKitConfiguration
import io.ton.walletkit.internal.TONWalletKitFactory
import io.ton.walletkit.listener.TONBridgeEventsHandler
import io.ton.walletkit.model.SignDataResult
import io.ton.walletkit.model.TONNetwork
import io.ton.walletkit.model.WalletSigner

/**
 * TON Wallet Kit SDK for managing wallets and TON Connect.
 *
 * Create an instance via [initialize], add event handlers with [addEventsHandler],
 * then manage wallets via [addWallet], [createV4R2WalletWithSigner], or [createV5R1WalletWithSigner].
 */
interface ITONWalletKit {
    companion object {
        /**
         * Initialize the SDK.
         *
         * @param context Android application context
         * @param config SDK configuration (network, storage, engine)
         * @return Initialized SDK instance
         */
        suspend inline fun initialize(
            context: Context,
            config: TONWalletKitConfiguration,
        ): ITONWalletKit = TONWalletKitFactory.create(context, config)
    }

    /**
     * Add event handler for TON Connect and transaction events.
     */
    suspend fun addEventsHandler(eventsHandler: TONBridgeEventsHandler)

    /**
     * Remove event handler.
     */
    suspend fun removeEventsHandler(eventsHandler: TONBridgeEventsHandler)

    /**
     * Shut down SDK and release resources.
     */
    suspend fun destroy()

    /**
     * Create V4R2 wallet from mnemonic phrase.
     * If mnemonic is null, a new random mnemonic will be generated.
     *
     * @param mnemonic 24-word mnemonic phrase, or null to generate a new one
     * @param network Network to use (MAINNET or TESTNET)
     * @return Created wallet instance
     */
    suspend fun createV4R2WalletFromMnemonic(
        mnemonic: List<String>? = null,
        network: TONNetwork = TONNetwork.MAINNET,
    ): ITONWallet

    /**
     * Create V5R1 wallet from mnemonic phrase.
     * If mnemonic is null, a new random mnemonic will be generated.
     *
     * @param mnemonic 24-word mnemonic phrase, or null to generate a new one
     * @param network Network to use (MAINNET or TESTNET)
     * @return Created wallet instance
     */
    suspend fun createV5R1WalletFromMnemonic(
        mnemonic: List<String>? = null,
        network: TONNetwork = TONNetwork.MAINNET,
    ): ITONWallet

    /**
     * Create V4R2 wallet from secret key (private key).
     *
     * @param secretKey 32-byte secret key
     * @param network Network to use (MAINNET or TESTNET)
     * @return Created wallet instance
     */
    suspend fun createV4R2WalletFromSecretKey(
        secretKey: ByteArray,
        network: TONNetwork = TONNetwork.MAINNET,
    ): ITONWallet

    /**
     * Create V5R1 wallet from secret key (private key).
     *
     * @param secretKey 32-byte secret key
     * @param network Network to use (MAINNET or TESTNET)
     * @return Created wallet instance
     */
    suspend fun createV5R1WalletFromSecretKey(
        secretKey: ByteArray,
        network: TONNetwork = TONNetwork.MAINNET,
    ): ITONWallet

    /**
     * Create V4R2 wallet with external signer (hardware wallet, watch-only).
     *
     * The signer will be called for all signing operations.
     *
     * @param signer External signer implementation
     * @param network Network to use
     * @return Created wallet instance
     */
    suspend fun createV4R2WalletWithSigner(
        signer: WalletSigner,
        network: TONNetwork = TONNetwork.MAINNET,
    ): ITONWallet

    /**
     * Create V5R1 wallet with external signer (hardware wallet, watch-only).
     *
     * The signer will be called for all signing operations.
     *
     * @param signer External signer implementation
     * @param network Network to use
     * @return Created wallet instance
     */
    suspend fun createV5R1WalletWithSigner(
        signer: WalletSigner,
        network: TONNetwork = TONNetwork.MAINNET,
    ): ITONWallet

    /**
     * Get all wallets managed by SDK.
     */
    suspend fun getWallets(): List<ITONWallet>

    /**
     * Derive public key from mnemonic without creating wallet.
     *
     * Useful for custom signers where you need the public key
     * but don't want to store the mnemonic.
     *
     * @param mnemonic 24-word mnemonic phrase
     * @return Hex-encoded public key
     */
    suspend fun derivePublicKey(mnemonic: List<String>): String

    /**
     * Sign data with mnemonic (for custom signer implementations).
     *
     * @param mnemonic Mnemonic phrase
     * @param data Bytes to sign
     * @param mnemonicType Mnemonic type (ton or bip39)
     * @return Signature result
     */
    suspend fun signDataWithMnemonic(
        mnemonic: List<String>,
        data: ByteArray,
        mnemonicType: String = "ton",
    ): SignDataResult

    /**
     * Trigger transaction approval flow.
     *
     * This triggers the onTransactionRequest event for user confirmation.
     *
     * @param wallet Wallet to send from
     * @param transactionContent Transaction from createTransfer* methods
     */
    suspend fun handleNewTransaction(wallet: ITONWallet, transactionContent: String)

    /**
     * Disconnect TON Connect session.
     *
     * @param sessionId Session ID to disconnect
     */
    suspend fun disconnectSession(sessionId: String)

    /**
     * Create WebView TON Connect injector.
     *
     * Used internally by WebView extension functions.
     *
     * @param webView WebView to inject into
     * @return Injector for setup/cleanup
     */
    fun createWebViewInjector(webView: android.webkit.WebView): WebViewTonConnectInjector
}

/**
 * WebView TON Connect injector for enabling TON Connect in WebView.
 *
 * Created by [ITONWalletKit.createWebViewInjector].
 */
interface WebViewTonConnectInjector {
    /**
     * Setup TON Connect in WebView.
     */
    fun setup()

    /**
     * Cleanup TON Connect resources.
     */
    fun cleanup()
}
