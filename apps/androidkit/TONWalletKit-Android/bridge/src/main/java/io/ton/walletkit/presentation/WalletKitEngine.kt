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
     * Sign arbitrary data using a mnemonic via the embedded JS bundle.
     *
     * This helper is primarily intended for demo environments where the mnemonic
     * is available in-app (e.g., simulated external signers). Production apps
     * should forward [WalletSigner.sign] requests to their secure signer instead.
     *
     * @param words Mnemonic phrase as a list of words
     * @param data Raw bytes that need to be signed
     * @param mnemonicType Mnemonic type ("ton" or "bip39"), defaults to "ton"
     * @return Signature bytes
     * @throws WalletKitBridgeException if signing fails
     */
    suspend fun signDataWithMnemonic(
        words: List<String>,
        data: ByteArray,
        mnemonicType: String = "ton",
    ): ByteArray

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
     * Handle a TonConnect request from a dApp (via internal browser or extension).
     * This processes the request and invokes the callback with the response.
     *
     * @param messageId Unique message ID from the dApp
     * @param method Request method (e.g., "connect", "sendTransaction", "signData", "send")
     * @param paramsJson Request parameters as JSON string (can be object or array for 'send' method)
     * @param url The current dApp URL (for extracting the domain)
     * @param responseCallback Callback to send response back to dApp
     */
    suspend fun handleTonConnectRequest(
        messageId: String,
        method: String,
        paramsJson: String?,
        url: String? = null,
        responseCallback: (org.json.JSONObject) -> Unit,
    )

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
     * Send a transaction to the blockchain.
     *
     * This method takes transaction content (as JSON) and sends it to the blockchain,
     * returning the transaction hash. This matches the iOS wallet.sendTransaction() behavior.
     *
     * @param walletAddress Wallet address that will sign and send the transaction
     * @param transactionContent Transaction content as JSON (from transferNFT, createTransferJettonTransaction, etc.)
     * @return Transaction hash (signedBoc) after successful broadcast
     * @throws WalletKitBridgeException if sending fails
     */
    suspend fun sendTransaction(
        walletAddress: String,
        transactionContent: String,
    ): String

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
     * Get NFTs owned by a wallet with pagination.
     *
     * @param walletAddress Wallet address to get NFTs for
     * @param limit Maximum number of NFTs to return
     * @param offset Offset for pagination
     * @return NFT items with pagination info
     * @throws WalletKitBridgeException if the request fails
     */
    suspend fun getNfts(walletAddress: String, limit: Int = 100, offset: Int = 0): io.ton.walletkit.domain.model.TONNFTItems

    /**
     * Get a single NFT by its address.
     *
     * @param nftAddress NFT contract address
     * @return NFT item or null if not found
     * @throws WalletKitBridgeException if the request fails
     */
    suspend fun getNft(nftAddress: String): io.ton.walletkit.domain.model.TONNFTItem?

    /**
     * Create an NFT transfer transaction with human-friendly parameters.
     *
     * @param walletAddress Wallet address to transfer from
     * @param params Transfer parameters
     * @return Transaction content as JSON string
     * @throws WalletKitBridgeException if transaction creation fails
     */
    suspend fun createTransferNftTransaction(
        walletAddress: String,
        params: io.ton.walletkit.domain.model.TONNFTTransferParamsHuman,
    ): String

    /**
     * Create an NFT transfer transaction with raw parameters.
     *
     * @param walletAddress Wallet address to transfer from
     * @param params Raw transfer parameters
     * @return Transaction content as JSON string
     * @throws WalletKitBridgeException if transaction creation fails
     */
    suspend fun createTransferNftRawTransaction(
        walletAddress: String,
        params: io.ton.walletkit.domain.model.TONNFTTransferParamsRaw,
    ): String

    /**
     * Get jetton wallets owned by a wallet with pagination.
     *
     * @param walletAddress Wallet address to get jettons for
     * @param limit Maximum number of jetton wallets to return
     * @param offset Offset for pagination
     * @return Jetton wallets with pagination info
     * @throws WalletKitBridgeException if the request fails
     */
    suspend fun getJettons(walletAddress: String, limit: Int = 100, offset: Int = 0): io.ton.walletkit.domain.model.TONJettonWallets

    /**
     * Get a single jetton by its master contract address.
     *
     * @param jettonAddress Jetton master contract address
     * @return Jetton information or null if not found
     * @throws WalletKitBridgeException if the request fails
     */
    suspend fun getJetton(jettonAddress: String): io.ton.walletkit.domain.model.TONJetton?

    /**
     * Create a jetton transfer transaction.
     *
     * @param walletAddress Wallet address to transfer from
     * @param params Transfer parameters
     * @return Transaction content as JSON string
     * @throws WalletKitBridgeException if transaction creation fails
     */
    suspend fun createTransferJettonTransaction(
        walletAddress: String,
        params: io.ton.walletkit.domain.model.TONJettonTransferParams,
    ): String

    /**
     * Get the balance of a specific jetton for a wallet.
     *
     * @param walletAddress Wallet address
     * @param jettonAddress Jetton master contract address
     * @return Balance as a string (in jetton units)
     * @throws WalletKitBridgeException if balance retrieval fails
     */
    suspend fun getJettonBalance(walletAddress: String, jettonAddress: String): String

    /**
     * Get the jetton wallet address for a specific jetton master contract.
     *
     * @param walletAddress User's main wallet address
     * @param jettonAddress Jetton master contract address
     * @return Jetton wallet contract address
     * @throws WalletKitBridgeException if address retrieval fails
     */
    suspend fun getJettonWalletAddress(walletAddress: String, jettonAddress: String): String

    /**
     * Call a bridge method directly.
     *
     * This is used internally by browser extensions to emit events.
     *
     * @param method The bridge method name
     * @param params Optional JSON parameters
     * @return The JSON response from the bridge
     * @throws WalletKitBridgeException if the call fails
     */
    suspend fun callBridgeMethod(method: String, params: org.json.JSONObject? = null): org.json.JSONObject

    /**
     * Add an event handler to receive SDK events.
     *
     * This allows adding event handlers after initialization, enabling on-demand
     * event handling. Multiple handlers can be added, and each will receive all events.
     *
     * @param eventsHandler Handler for SDK events
     */
    suspend fun addEventsHandler(eventsHandler: io.ton.walletkit.presentation.listener.TONBridgeEventsHandler)

    /**
     * Remove a previously added event handler.
     *
     * @param eventsHandler Handler to remove
     */
    suspend fun removeEventsHandler(eventsHandler: io.ton.walletkit.presentation.listener.TONBridgeEventsHandler)

    /**
     * Destroy the engine and release all resources.
     */
    suspend fun destroy()
}
