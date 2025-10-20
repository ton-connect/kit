package io.ton.walletkit.presentation

import io.ton.walletkit.domain.model.SignDataResult
import io.ton.walletkit.domain.model.Transaction
import io.ton.walletkit.domain.model.WalletAccount
import io.ton.walletkit.domain.model.WalletSession
import io.ton.walletkit.domain.model.WalletState
import io.ton.walletkit.presentation.config.TONWalletKitConfiguration
import io.ton.walletkit.presentation.event.ConnectRequestEvent
import io.ton.walletkit.presentation.event.SignDataRequestEvent
import io.ton.walletkit.presentation.event.TransactionRequestEvent

/**
 * Abstraction over a runtime that can execute the WalletKit JavaScript bundle and expose
 * the wallet APIs to Android callers. Implementations may back the runtime with a WebView or
 * an embedded JavaScript engine such as QuickJS. Every implementation must provide the same
 * JSON-RPC surface as the historical [WalletKitBridge] class.
 *
 * **Auto-Initialization:**
 * All methods that require WalletKit initialization will automatically initialize the SDK
 * if it hasn't been initialized yet. This means calling [init] explicitly is optional -
 * you can call any method and initialization will happen automatically with default settings.
 * If you need custom configuration, call [init] with your config before other methods.
 *
 * **Event Handling:**
 * Events are handled via the eventsHandler passed during engine creation.
 *
 * @suppress Internal engine abstraction. Use TONWalletKit and TONWallet public API instead.
 */
internal interface WalletKitEngine {
    val kind: WalletKitEngineKind

    /**
     * Initialize WalletKit with custom configuration. This must be called before any other method;
     * subsequent calls are ignored once initialization succeeds.
     *
     * @param configuration Configuration for the WalletKit SDK
     * @throws WalletKitBridgeException if initialization fails
     */
    suspend fun init(configuration: TONWalletKitConfiguration)

    /**
     * Add a new wallet from mnemonic phrase.
     *
     * @param words Mnemonic phrase as a list of words
     * @param name Optional user-assigned name for the wallet
     * @param version Wallet version (e.g., "v5r1", "v4r2")
     * @param network Network to use (e.g., "mainnet", "testnet"), defaults to current network
     * @return The newly added wallet account
     * @throws WalletKitBridgeException if wallet creation fails
     */
    suspend fun addWalletFromMnemonic(
        words: List<String>,
        name: String? = null,
        version: String,
        network: String? = null,
    ): WalletAccount

    /**
     * Derive public key from a mnemonic phrase without creating a wallet.
     *
     * This is useful for creating external signers (hardware wallets, watch-only wallets)
     * where you need the public key but don't want to store the mnemonic in the SDK.
     *
     * @param words Mnemonic phrase as a list of words
     * @return The hex-encoded public key
     * @throws WalletKitBridgeException if derivation fails
     */
    suspend fun derivePublicKeyFromMnemonic(words: List<String>): String

    /**
     * Generate a new mnemonic phrase using the WalletKit JS utilities.
     *
     * @param wordCount Number of words to generate (12 or 24). Defaults to 24.
     * @return List of mnemonic words
     * @throws WalletKitBridgeException if generation fails
     */
    suspend fun createTonMnemonic(wordCount: Int = 24): List<String>

    /**
     * Add a new wallet using an external signer.
     *
     * This allows creating wallets where the private key is managed externally
     * (e.g., hardware wallet, watch-only wallet, separate secure module).
     *
     * @param signer The external signer that will handle signing operations
     * @param version Wallet version (e.g., "v5r1", "v4r2")
     * @param network Network to use (e.g., "mainnet", "testnet"), defaults to current network
     * @return The newly added wallet account
     * @throws WalletKitBridgeException if wallet creation fails
     */
    suspend fun addWalletWithSigner(
        signer: io.ton.walletkit.domain.model.WalletSigner,
        version: String,
        network: String? = null,
    ): WalletAccount

    /**
     * Respond to a sign request from an external signer wallet.
     *
     * When a wallet created with [addWalletWithSigner] needs to sign data,
     * it will emit a signerSignRequest event. The app should call this method
     * to provide the signature or error.
     *
     * @param signerId The signer ID from the sign request event
     * @param requestId The request ID from the sign request event
     * @param signature The signature bytes, or null if error
     * @param error Error message if signing failed, or null if successful
     */
    suspend fun respondToSignRequest(
        signerId: String,
        requestId: String,
        signature: ByteArray? = null,
        error: String? = null,
    )

    /**
     * Get all wallets managed by this engine.
     *
     * @return List of wallet accounts
     */
    suspend fun getWallets(): List<WalletAccount>

    /**
     * Remove a wallet by address.
     *
     * @param address Wallet address to remove
     * @throws WalletKitBridgeException if removal fails
     */
    suspend fun removeWallet(address: String)

    /**
     * Get the current state of a wallet.
     *
     * @param address Wallet address
     * @return Current wallet state including balance and transactions
     * @throws WalletKitBridgeException if state retrieval fails
     */
    suspend fun getWalletState(address: String): WalletState

    /**
     * Get recent transactions for a wallet.
     *
     * @param address Wallet address
     * @param limit Maximum number of transactions to return (default 10)
     * @return List of recent transactions
     * @throws WalletKitBridgeException if transaction retrieval fails
     */
    suspend fun getRecentTransactions(address: String, limit: Int = 10): List<Transaction>

    /**
     * Handle a TON Connect URL (e.g., from QR code scan or deep link).
     * This will trigger appropriate events (connect request, transaction request, etc.)
     *
     * @param url TON Connect URL to handle
     * @throws WalletKitBridgeException if URL handling fails
     */
    suspend fun handleTonConnectUrl(url: String)

    /**
     * Create a new locally-initiated transaction request.
     * This will trigger a transaction request event that needs to be approved via [approveTransaction].
     *
     * @param walletAddress Source wallet address
     * @param recipient Recipient address
     * @param amount Amount in nanoTON
     * @param comment Optional comment/message
     * @throws WalletKitBridgeException if transaction creation fails
     */
    suspend fun sendLocalTransaction(
        walletAddress: String,
        recipient: String,
        amount: String,
        comment: String? = null,
    )

    /**
     * Approve a connection request from a dApp.
     *
     * @param event Typed event from the connect request
     * @throws WalletKitBridgeException if approval fails
     */
    suspend fun approveConnect(event: ConnectRequestEvent)

    /**
     * Reject a connection request from a dApp.
     *
     * @param event Typed event from the connect request
     * @param reason Optional reason for rejection
     * @throws WalletKitBridgeException if rejection fails
     */
    suspend fun rejectConnect(
        event: ConnectRequestEvent,
        reason: String? = null,
    )

    /**
     * Approve and sign a transaction request.
     *
     * @param event Typed event from the transaction request
     * @throws WalletKitBridgeException if approval or signing fails
     */
    suspend fun approveTransaction(event: TransactionRequestEvent)

    /**
     * Reject a transaction request.
     *
     * @param event Typed event from the transaction request
     * @param reason Optional reason for rejection
     * @throws WalletKitBridgeException if rejection fails
     */
    suspend fun rejectTransaction(
        event: TransactionRequestEvent,
        reason: String? = null,
    )

    /**
     * Approve and sign a data signing request.
     *
     * @param event Typed event from the sign data request
     * @return Signature result containing the base64-encoded signature
     * @throws WalletKitBridgeException if approval or signing fails
     */
    suspend fun approveSignData(event: SignDataRequestEvent): SignDataResult

    /**
     * Reject a data signing request.
     *
     * @param event Typed event from the sign data request
     * @param reason Optional reason for rejection
     * @throws WalletKitBridgeException if rejection fails
     */
    suspend fun rejectSignData(
        event: SignDataRequestEvent,
        reason: String? = null,
    )

    /**
     * Get all active TON Connect sessions.
     *
     * @return List of active sessions
     */
    suspend fun listSessions(): List<WalletSession>

    /**
     * Disconnect a TON Connect session.
     *
     * @param sessionId Session ID to disconnect, or null to disconnect all sessions
     * @throws WalletKitBridgeException if disconnection fails
     */
    suspend fun disconnectSession(sessionId: String? = null)

    /**
     * Destroy the engine and release all resources.
     */
    suspend fun destroy()
}
