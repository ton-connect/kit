package io.ton.walletkit.engine

import io.ton.walletkit.config.TONWalletKitConfiguration
import io.ton.walletkit.core.WalletKitEngineKind
import io.ton.walletkit.event.ConnectRequestEvent
import io.ton.walletkit.event.SignDataRequestEvent
import io.ton.walletkit.event.TransactionRequestEvent
import io.ton.walletkit.model.Transaction
import io.ton.walletkit.model.WalletAccount
import io.ton.walletkit.model.WalletSession
import io.ton.walletkit.model.WalletState
import io.ton.walletkit.request.RequestHandler

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
internal interface WalletKitEngine : RequestHandler {
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
     * Create a V5R1 wallet from mnemonic and add it to the kit.
     * Matches the JS API `createV5R1WalletUsingMnemonic()` function.
     *
     * @param words Mnemonic phrase as a list of words
     * @param network Network to use (e.g., "mainnet", "testnet"), defaults to current network
     * @return Object containing wallet address and publicKey
     * @throws WalletKitBridgeException if wallet creation fails
     */
    suspend fun createV5R1WalletAdapter(
        words: List<String>,
        network: String? = null,
    ): Any

    /**
     * Create a V4R2 wallet from mnemonic and add it to the kit.
     * Matches the JS API `createV4R2WalletUsingMnemonic()` function.
     *
     * @param words Mnemonic phrase as a list of words
     * @param network Network to use (e.g., "mainnet", "testnet"), defaults to current network
     * @return Object containing wallet address and publicKey
     * @throws WalletKitBridgeException if wallet creation fails
     */
    suspend fun createV4R2WalletAdapter(
        words: List<String>,
        network: String? = null,
    ): Any

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
        signer: io.ton.walletkit.model.WalletSigner,
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
     * Create a TON transfer transaction.
     *
     * This method creates transaction content matching the JS WalletKit API wallet.createTransferTonTransaction().
     * The returned transaction content can be passed to handleNewTransaction() to trigger the approval flow.
     *
     * @param walletAddress Source wallet address
     * @param params Transfer parameters (recipient, amount, optional comment/body/stateInit)
     * @return Transaction content as JSON string
     * @throws WalletKitBridgeException if transaction creation fails
     */
    suspend fun createTransferTonTransaction(
        walletAddress: String,
        params: io.ton.walletkit.model.TONTransferParams,
    ): String

    /**
     * Handle a new transaction initiated from the wallet app.
     *
     * This method matches the JS WalletKit API kit.handleNewTransaction() and triggers
     * a transaction request event that can be approved or rejected via the event handler.
     *
     * @param walletAddress Wallet address that will sign the transaction
     * @param transactionContent Transaction content as JSON (from createTransferTonTransaction, etc.)
     * @throws WalletKitBridgeException if transaction handling fails
     */
    suspend fun handleNewTransaction(
        walletAddress: String,
        transactionContent: String,
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
    override suspend fun approveConnect(event: ConnectRequestEvent)

    /**
     * Reject a connection request from a dApp.
     *
     * @param event Typed event from the connect request
     * @param reason Optional reason for rejection
     * @throws WalletKitBridgeException if rejection fails
     */
    override suspend fun rejectConnect(
        event: ConnectRequestEvent,
        reason: String?,
    )

    /**
     * Approve and sign a transaction request.
     *
     * @param event Typed event from the transaction request
     * @throws WalletKitBridgeException if approval or signing fails
     */
    override suspend fun approveTransaction(event: TransactionRequestEvent)

    /**
     * Reject a transaction request.
     *
     * @param event Typed event from the transaction request
     * @param reason Optional reason for rejection
     * @throws WalletKitBridgeException if rejection fails
     */
    override suspend fun rejectTransaction(
        event: TransactionRequestEvent,
        reason: String?,
    )

    /**
     * Approve and sign a data signing request.
     *
     * @param event Typed event from the sign data request
     * @throws WalletKitBridgeException if approval or signing fails
     */
    override suspend fun approveSignData(event: SignDataRequestEvent)

    /**
     * Reject a data signing request.
     *
     * @param event Typed event from the sign data request
     * @param reason Optional reason for rejection
     * @throws WalletKitBridgeException if rejection fails
     */
    override suspend fun rejectSignData(
        event: SignDataRequestEvent,
        reason: String?,
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
    suspend fun getNfts(walletAddress: String, limit: Int = 100, offset: Int = 0): io.ton.walletkit.model.TONNFTItems

    /**
     * Get a single NFT by its address.
     *
     * @param nftAddress NFT contract address
     * @return NFT item or null if not found
     * @throws WalletKitBridgeException if the request fails
     */
    suspend fun getNft(nftAddress: String): io.ton.walletkit.model.TONNFTItem?

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
        params: io.ton.walletkit.model.TONNFTTransferParamsHuman,
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
        params: io.ton.walletkit.model.TONNFTTransferParamsRaw,
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
    suspend fun getJettons(walletAddress: String, limit: Int = 100, offset: Int = 0): io.ton.walletkit.model.TONJettonWallets

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
        params: io.ton.walletkit.model.TONJettonTransferParams,
    ): String

    /**
     * Create a multi-recipient TON transfer transaction.
     *
     * @param walletAddress Wallet address to transfer from
     * @param messages List of transfer parameters for each recipient
     * @return Transaction content as JSON string
     * @throws WalletKitBridgeException if transaction creation fails
     */
    suspend fun createTransferMultiTonTransaction(
        walletAddress: String,
        messages: List<io.ton.walletkit.model.TONTransferParams>,
    ): String

    /**
     * Get a preview of a transaction including estimated fees.
     *
     * @param walletAddress Wallet address
     * @param transactionContent Transaction content as JSON string
     * @return Transaction preview with fee estimation
     * @throws WalletKitBridgeException if preview generation fails
     */
    suspend fun getTransactionPreview(
        walletAddress: String,
        transactionContent: String,
    ): io.ton.walletkit.model.TONTransactionPreview

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
    suspend fun addEventsHandler(eventsHandler: io.ton.walletkit.listener.TONBridgeEventsHandler)

    /**
     * Remove a previously added event handler.
     *
     * @param eventsHandler Handler to remove
     */
    suspend fun removeEventsHandler(eventsHandler: io.ton.walletkit.listener.TONBridgeEventsHandler)

    /**
     * Destroy the engine and release all resources.
     */
    suspend fun destroy()
}
