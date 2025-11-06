package io.ton.walletkit.core

import io.ton.walletkit.ITONWallet
import io.ton.walletkit.WalletKitBridgeException
import io.ton.walletkit.config.SignDataType
import io.ton.walletkit.engine.WalletKitEngine
import io.ton.walletkit.model.SignDataResult
import io.ton.walletkit.model.TONJettonTransferParams
import io.ton.walletkit.model.TONJettonWallets
import io.ton.walletkit.model.TONNFTItem
import io.ton.walletkit.model.TONNFTItems
import io.ton.walletkit.model.TONNFTTransferParamsHuman
import io.ton.walletkit.model.TONNFTTransferParamsRaw
import io.ton.walletkit.model.TONNetwork
import io.ton.walletkit.model.TONTransactionPreview
import io.ton.walletkit.model.TONTransferParams
import io.ton.walletkit.model.Transaction
import io.ton.walletkit.model.WalletAccount
import io.ton.walletkit.model.WalletSession
import io.ton.walletkit.model.WalletSigner

/**
 * Represents a TON wallet with balance and state management.
 *
 * Mirrors the canonical TON Wallet contract interface for cross-platform consistency.
 *
 * Use [TONWallet.add] to create a new wallet from mnemonic data.
 *
 * Example:
 * ```kotlin
 * val data = TONWalletData(
 *     mnemonic = listOf("word1", "word2", ...),
 *     name = "My Wallet",
 *     network = TONNetwork.MAINNET,
 *     version = "v5r1"
 * )
 * val wallet = TONWallet.add(data)
 * val balance = wallet.balance()
 * wallet.connect("tc://...")
 * wallet.remove()
 * ```
 *
 * @property address Wallet address (null if not yet created)
 * @property publicKey Public key of the wallet (null if not available)
 */
internal class TONWallet internal constructor(
    override val address: String?,
    private val engine: WalletKitEngine,
    private val account: WalletAccount?,
) : ITONWallet {
    /**
     * Public key of the wallet.
     */
    override val publicKey: String? get() = account?.publicKey
    companion object {
        /**
         * Derive a public key from a mnemonic phrase without creating a wallet.
         *
         * This is useful for external signers (hardware wallets, watch-only wallets)
         * where you need the public key but don't want to store the mnemonic.
         *
         * Example:
         * ```kotlin
         * val kit = TONWalletKit.initialize(context, config)
         * val mnemonic = listOf("word1", "word2", ..., "word24")
         * val publicKey = TONWallet.derivePublicKey(kit, mnemonic)
         *
         * // Now create a custom signer with this public key
         * val signer = object : WalletSigner {
         *     override val publicKey = publicKey
         *     override suspend fun sign(data: ByteArray): ByteArray {
         *         // Forward to hardware wallet for signing
         *         return hardwareWallet.sign(data)
         *     }
         * }
         * ```
         *
         * @param mnemonic 24-word mnemonic phrase
         * @return Hex-encoded public key
         * @throws io.ton.walletkit.WalletKitBridgeException if derivation fails or SDK not initialized
         */
        suspend fun derivePublicKey(kit: TONWalletKit, mnemonic: List<String>): String {
            return kit.engine.derivePublicKeyFromMnemonic(mnemonic)
        }

        /**
         * Sign arbitrary data using the SDK's JS signer utilities.
         *
         * This helper is intended for demo or testing scenarios where the mnemonic
         * is available in-app (e.g., simulated external signers). Production apps should
         * forward [WalletSigner.sign] requests to their secure signer implementation instead.
         *
         * @param kit The TONWalletKit instance
         * @param mnemonic Mnemonic phrase used to derive the signing key
         * @param data Bytes that need to be signed
         * @param mnemonicType Mnemonic type ("ton" by default)
         */
        suspend fun signDataWithMnemonic(
            kit: TONWalletKit,
            mnemonic: List<String>,
            data: ByteArray,
            mnemonicType: String = "ton",
        ): ByteArray {
            return kit.engine.signDataWithMnemonic(mnemonic, data, mnemonicType)
        }

        /**
         * Add a new wallet using an external signer.
         *
         * Use this method to create wallets where the private key is managed externally,
         * such as hardware wallets, watch-only wallets, or separate secure modules.
         *
         * @param kit The TONWalletKit instance
         *
         * The [signer] will be called whenever the wallet needs to sign a transaction or data.
         *
         * Example:
         * ```kotlin
         * val signer = object : WalletSigner {
         *     override val publicKey = "your_public_key_hex"
         *
         *     override suspend fun sign(data: ByteArray): ByteArray {
         *         // Show confirmation dialog to user
         *         // Call hardware wallet or external signing service
         *         return signature
         *     }
         * }
         *
         * val wallet = TONWallet.addWithSigner(
         *     signer = signer,
         *     version = "v4r2",
         *     network = TONNetwork.MAINNET
         * )
         * ```
         *
         * @param kit The TONWalletKit instance
         * @param signer The external signer that will handle all signing operations
         * @param network Network to use (default: MAINNET)
         * @return The newly created V4R2 wallet
         * @throws io.ton.walletkit.WalletKitBridgeException if wallet creation fails
         */
        suspend fun createV4R2WithSigner(
            kit: TONWalletKit,
            signer: WalletSigner,
            network: TONNetwork = TONNetwork.MAINNET,
        ): TONWallet {
            val account = kit.engine.createV4R2WalletWithSigner(
                signer = signer,
                network = network.value,
            )

            return TONWallet(
                address = account.address,
                engine = kit.engine,
                account = account,
            )
        }

        /**
         * Create a V5R1 wallet backed by an external signer.
         *
         * Similar to [createV4R2WithSigner] but creates a V5R1 wallet contract.
         *
         * Example:
         * ```kotlin
         * val wallet = TONWallet.createV5R1WithSigner(
         *     kit = walletKit,
         *     signer = myHardwareWalletSigner,
         *     network = TONNetwork.MAINNET
         * )
         * ```
         *
         * @param kit The TONWalletKit instance
         * @param signer The external signer that will handle all signing operations
         * @param network Network to use (default: MAINNET)
         * @return The newly created V5R1 wallet
         * @throws io.ton.walletkit.WalletKitBridgeException if wallet creation fails
         */
        suspend fun createV5R1WithSigner(
            kit: TONWalletKit,
            signer: WalletSigner,
            network: TONNetwork = TONNetwork.MAINNET,
        ): TONWallet {
            val account = kit.engine.createV5R1WalletWithSigner(
                signer = signer,
                network = network.value,
            )

            return TONWallet(
                address = account.address,
                engine = kit.engine,
                account = account,
            )
        }

        /**
         * Get all wallets managed by the SDK.
         *
         * **Note:** This method is deprecated. Use `kit.getWallets()` instead to stay aligned with the primary kit API.
         *
         * @param kit The TONWalletKit instance
         * @return List of all wallets
         */
        @Deprecated("Use kit.getWallets() instead", ReplaceWith("kit.getWallets()"))
        suspend fun wallets(kit: TONWalletKit): List<TONWallet> {
            return kit.getWallets().map { it as TONWallet }
        }
    }

    /**
     * Get the current balance of this wallet.
     *
     * @return Balance in nanoTON as a string, or null if not available
     * @throws io.ton.walletkit.WalletKitBridgeException if balance retrieval fails
     */
    suspend fun balance(): String? {
        val addr = address ?: return null
        return engine.getWalletState(addr).balance
    }

    /**
     * Get the state init BOC for this wallet.
     *
     * The implementation currently returns null until state init retrieval is added to the engine.
     *
     * @return State init as base64-encoded BOC, or null if not available
     * @throws io.ton.walletkit.WalletKitBridgeException if state init retrieval fails
     */
    suspend fun stateInit(): String? {
        // TODO: Implement state init retrieval when available in engine
        // Reference implementation: wallet.getSateInit()?.toString()
        return null
    }

    /**
     * Handle a TON Connect URL (e.g., from QR code scan or deep link).
     *
     * This will trigger appropriate events (connect request, transaction request, etc.)
     * that will be delivered to your event handler.
     *
     * @param url TON Connect URL to handle
     * @throws io.ton.walletkit.WalletKitBridgeException if URL handling fails
     */
    override suspend fun connect(url: String) {
        engine.handleTonConnectUrl(url)
    }

    /**
     * Remove this wallet from the wallet kit.
     *
     * This permanently deletes the wallet. Make sure the user has backed up
     * their mnemonic before calling this.
     *
     * @throws io.ton.walletkit.WalletKitBridgeException if removal fails
     */
    override suspend fun remove() {
        val addr = address ?: return
        engine.removeWallet(addr)
    }

    /**
     * Get recent transactions for this wallet.
     *
     * This is an Android-specific convenience method; other platforms typically manage
     * transaction data separately using their own storage.
     *
     * @param limit Maximum number of transactions to return (default 10)
     * @return List of recent transactions
     * @throws io.ton.walletkit.WalletKitBridgeException if transaction retrieval fails
     */
    override suspend fun transactions(limit: Int): List<Transaction> {
        val addr = address ?: return emptyList()
        return engine.getRecentTransactions(addr, limit)
    }

    /**
     * Get active TON Connect sessions for this wallet.
     *
     * This is an Android-specific convenience method for viewing which dApps
     * are connected to this specific wallet.
     *
     * @return List of active sessions associated with this wallet
     * @throws io.ton.walletkit.WalletKitBridgeException if session retrieval fails
     */
    override suspend fun sessions(): List<WalletSession> {
        val addr = address ?: return emptyList()
        // Get all sessions and filter by wallet address
        return engine.listSessions().filter { session ->
            session.walletAddress == addr
        }
    }

    /**
     * Create a TON transfer transaction.
     *
     * This method creates transaction content that can be passed to `kit.handleNewTransaction()`
     * to trigger the approval flow. This matches the JS WalletKit API:
     *
     * ```typescript
     * const tx = await wallet.createTransferTonTransaction(params);
     * await kit.handleNewTransaction(wallet, tx);
     * ```
     *
     * @param params Transfer parameters (recipient address, amount, optional comment/body/stateInit)
     * @return Transaction content as JSON string
     * @throws io.ton.walletkit.WalletKitBridgeException if transaction creation fails
     */
    override suspend fun createTransferTonTransaction(params: TONTransferParams): String {
        val addr = address ?: throw WalletKitBridgeException("Wallet address is null")
        return engine.createTransferTonTransaction(addr, params)
    }

    /**
     * Create a multi-recipient TON transfer transaction.
     * Matches the JS API `wallet.createTransferMultiTonTransaction()` function.
     *
     * Allows sending TON to multiple recipients in a single transaction.
     *
     * @param messages List of transfer messages (each with recipient address, amount, optional comment)
     * @return Transaction content as JSON string
     * @throws WalletKitBridgeException if transaction creation fails
     */
    override suspend fun createTransferMultiTonTransaction(messages: List<TONTransferParams>): String {
        val addr = address ?: throw WalletKitBridgeException("Wallet address is null")
        return engine.createTransferMultiTonTransaction(addr, messages)
    }

    /**
     * Get transaction preview with fee estimation.
     * Matches the JS API `wallet.getTransactionPreview()` function.
     *
     * @param transactionContent Transaction content (from createTransfer* methods)
     * @return Transaction preview with fee information
     * @throws WalletKitBridgeException if preview generation fails
     */
    override suspend fun getTransactionPreview(transactionContent: String): TONTransactionPreview {
        val addr = address ?: throw WalletKitBridgeException("Wallet address is null")
        return engine.getTransactionPreview(addr, transactionContent)
    }

    /**
     * Get NFT items owned by this wallet.
     *
     * Matches the shared API surface for cross-platform consistency.
     *
     * @param limit Maximum number of NFTs to return (default: 100)
     * @param offset Offset for pagination (default: 0)
     * @return NFT items with pagination information
     * @throws WalletKitBridgeException if NFT retrieval fails
     */
    override suspend fun nfts(limit: Int, offset: Int): TONNFTItems {
        val addr = address ?: throw WalletKitBridgeException("Wallet address is null")
        return engine.getNfts(addr, limit, offset)
    }

    /**
     * Get a single NFT by its address.
     *
     * Matches the shared API surface for cross-platform consistency.
     *
     * @param nftAddress NFT contract address
     * @return NFT item or null if not found
     * @throws WalletKitBridgeException if NFT retrieval fails
     */
    override suspend fun getNFT(nftAddress: String): TONNFTItem? {
        return engine.getNft(nftAddress)
    }

    /**
     * Create an NFT transfer transaction with human-friendly parameters.
     * Matches the JS API `wallet.createTransferNftTransaction()` function.
     *
     * @param params Transfer parameters (NFT address, recipient, amount, optional comment)
     * @return Transaction content that can be sent via sendTransaction()
     * @throws WalletKitBridgeException if transaction creation fails
     */
    override suspend fun createTransferNFTTransaction(params: TONNFTTransferParamsHuman): String {
        val addr = address ?: throw WalletKitBridgeException("Wallet address is null")
        return engine.createTransferNftTransaction(addr, params)
    }

    /**
     * Create an NFT transfer transaction with raw parameters.
     * Matches the JS API `wallet.createTransferNftRawTransaction()` function.
     *
     * @param params Raw transfer parameters with full control over transfer message
     * @return Transaction content that can be sent via sendTransaction()
     * @throws WalletKitBridgeException if transaction creation fails
     */
    override suspend fun createTransferNftRawTransaction(params: TONNFTTransferParamsRaw): String {
        val addr = address ?: throw WalletKitBridgeException("Wallet address is null")
        return engine.createTransferNftRawTransaction(addr, params)
    }

    /**
     * Send a transaction to the blockchain.
     * Matches the JS API `wallet.sendTransaction()` function.
     *
     * This method takes transaction content (usually created by createTransferNftTransaction,
     * createTransferTonTransaction, createTransferJettonTransaction, etc.) and actually sends
     * it to the blockchain, returning the transaction hash.
     *
     * Example:
     * ```kotlin
     * // Create NFT transfer transaction
     * val txContent = wallet.createTransferNftTransaction(params)
     * // Send it to blockchain
     * val txHash = wallet.sendTransaction(txContent)
     * ```
     *
     * @param transactionContent Transaction content JSON (from createTransfer* methods)
     * @return Transaction hash (boc) after successful broadcast
     * @throws WalletKitBridgeException if sending fails
     */
    override suspend fun sendTransaction(transactionContent: String): String {
        val addr = address ?: throw WalletKitBridgeException("Wallet address is null")
        return engine.sendTransaction(addr, transactionContent)
    }

    /**
     * Get jetton wallets owned by this wallet with pagination.
     * Matches the JS API `wallet.getJettons()` function.
     *
     * @param limit Maximum number of jetton wallets to return (default: 100)
     * @param offset Offset for pagination (default: 0)
     * @return Jetton wallets with pagination information
     * @throws WalletKitBridgeException if jetton retrieval fails
     */
    override suspend fun jettons(limit: Int, offset: Int): TONJettonWallets {
        val addr = address ?: throw WalletKitBridgeException("Wallet address is null")
        return engine.getJettons(addr, limit, offset)
    }

    /**
     * Create a jetton transfer transaction.
     * Matches the JS API `wallet.createTransferJettonTransaction()` function.
     *
     * @param params Transfer parameters (recipient address, jetton address, amount, optional comment)
     * @return Transaction content that can be sent via sendTransaction()
     * @throws WalletKitBridgeException if transaction creation fails
     */
    override suspend fun createTransferJettonTransaction(params: TONJettonTransferParams): String {
        val addr = address ?: throw WalletKitBridgeException("Wallet address is null")
        return engine.createTransferJettonTransaction(addr, params)
    }

    /**
     * Get the balance of a specific jetton for this wallet.
     *
     * Matches the shared API surface for cross-platform consistency.
     *
     * @param jettonAddress Jetton master contract address
     * @return Balance as a string (in jetton units, not considering decimals)
     * @throws WalletKitBridgeException if balance retrieval fails
     */
    override suspend fun getJettonBalance(jettonAddress: String): String {
        val addr = address ?: throw WalletKitBridgeException("Wallet address is null")
        return engine.getJettonBalance(addr, jettonAddress)
    }

    /**
     * Get the jetton wallet address for a specific jetton master contract.
     *
     * Each user has a unique jetton wallet contract for each jetton they hold.
     * This method returns the address of this wallet's jetton wallet for the given jetton.
     *
     * Matches the shared API surface for cross-platform consistency.
     *
     * @param jettonAddress Jetton master contract address
     * @return Jetton wallet contract address
     * @throws WalletKitBridgeException if address retrieval fails
     */
    override suspend fun getJettonWalletAddress(jettonAddress: String): String {
        val addr = address ?: throw WalletKitBridgeException("Wallet address is null")
        return engine.getJettonWalletAddress(addr, jettonAddress)
    }

    // ========== Interface Implementations ==========

    override suspend fun getBalance(): String {
        return balance() ?: "0"
    }

    override suspend fun getRecentTransactions(limit: Int): List<Transaction> {
        val addr = address ?: throw WalletKitBridgeException("Wallet address is null")
        return engine.getRecentTransactions(addr, limit)
    }

    override suspend fun getNFTItems(
        limit: Int?,
        offset: Int?,
        collectionAddress: String?,
        indirectOwnership: Boolean?,
    ): TONNFTItems {
        val addr = address ?: throw WalletKitBridgeException("Wallet address is null")
        return engine.getNfts(addr, limit ?: 100, offset ?: 0)
    }

    override suspend fun getJettons(
        limit: Int?,
        offset: Int?,
    ): TONJettonWallets {
        val addr = address ?: throw WalletKitBridgeException("Wallet address is null")
        return engine.getJettons(addr, limit ?: 100, offset ?: 0)
    }

    override suspend fun signData(
        data: ByteArray,
        type: SignDataType,
    ): SignDataResult {
        // Sign data is handled via request/response flow, not direct signing
        // Use TONWallet.signDataWithMnemonic for static helper
        throw UnsupportedOperationException("Direct signing not supported. Use request/response flow via events.")
    }

    override suspend fun disconnect() {
        val addr = address ?: return
        engine.disconnectSession(null) // Disconnect all sessions for this wallet
    }
}
