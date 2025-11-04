package io.ton.walletkit

import android.content.Context
import io.ton.walletkit.config.TONWalletKitConfiguration
import io.ton.walletkit.listener.TONBridgeEventsHandler
import io.ton.walletkit.model.SignDataResult
import io.ton.walletkit.model.TONNetwork
import io.ton.walletkit.model.TONWalletData
import io.ton.walletkit.model.WalletSigner

/**
 * Main entry point for TON Wallet Kit SDK.
 *
 * Use the companion object's initialize method to create an instance.
 * Then add event handlers using [addEventsHandler] when you're ready to receive events.
 */
interface ITONWalletKit {
    companion object {
        /**
         * Initialize the SDK with the given configuration.
         *
         * @param context Android application context
         * @param config SDK configuration
         * @return Initialized ITONWalletKit instance
         */
        @Suppress("UNCHECKED_CAST")
        suspend fun initialize(
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

            // Call as suspend function - need to use kotlin.coroutines
            return kotlinx.coroutines.suspendCancellableCoroutine { continuation ->
                try {
                    method.invoke(companion, context, config, continuation)
                } catch (e: Exception) {
                    continuation.resumeWith(Result.failure(e))
                }
            }
        }
    }

    /**
     * Add an event handler to receive SDK events.
     */
    suspend fun addEventsHandler(eventsHandler: TONBridgeEventsHandler)

    /**
     * Remove a previously added event handler.
     */
    suspend fun removeEventsHandler(eventsHandler: TONBridgeEventsHandler)

    /**
     * Shut down the Wallet Kit instance and release all resources.
     */
    suspend fun destroy()

    /**
     * Generate a new TON mnemonic phrase.
     */
    suspend fun createMnemonic(wordCount: Int = 24): List<String>

    /**
     * Add a new wallet from mnemonic data.
     */
    suspend fun addWallet(data: TONWalletData): ITONWallet

    /**
     * Add a new wallet with an external signer.
     */
    suspend fun addWalletWithSigner(
        signer: WalletSigner,
        version: String = "v4r2",
        network: TONNetwork = TONNetwork.MAINNET,
    ): ITONWallet

    /**
     * Get all wallets managed by this SDK instance.
     */
    suspend fun getWallets(): List<ITONWallet>

    /**
     * Derive a public key from a mnemonic without creating a wallet.
     */
    suspend fun derivePublicKey(mnemonic: List<String>): String

    /**
     * Sign data with a mnemonic (for custom signers).
     */
    suspend fun signDataWithMnemonic(
        mnemonic: List<String>,
        data: ByteArray,
        mnemonicType: String = "ton",
    ): SignDataResult

    /**
     * Handle a new transaction initiated from the wallet app.
     */
    suspend fun handleNewTransaction(wallet: ITONWallet, transactionContent: String)

    /**
     * Disconnect a TON Connect session by session ID.
     *
     * @param sessionId The ID of the session to disconnect
     */
    suspend fun disconnectSession(sessionId: String)

    /**
     * Create a WebView TonConnect injector for the given WebView.
     * This is used internally by the WebView extension functions.
     *
     * @return An object that can setup and cleanup TonConnect in a WebView
     */
    fun createWebViewInjector(webView: android.webkit.WebView): WebViewTonConnectInjector
}

/**
 * Interface for managing TonConnect injection in a WebView.
 * Created by [ITONWalletKit.createWebViewInjector].
 */
interface WebViewTonConnectInjector {
    /**
     * Setup TonConnect in the WebView.
     */
    fun setup()

    /**
     * Cleanup TonConnect resources.
     */
    fun cleanup()
}
