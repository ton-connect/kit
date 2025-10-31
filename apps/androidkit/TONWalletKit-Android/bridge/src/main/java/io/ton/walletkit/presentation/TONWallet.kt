package io.ton.walletkit.presentation

import io.ton.walletkit.domain.model.TONNetwork
import io.ton.walletkit.domain.model.TONWalletData
import io.ton.walletkit.domain.model.WalletAccount
import io.ton.walletkit.domain.model.WalletSession
import io.ton.walletkit.domain.model.WalletSigner

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
class TONWallet internal constructor(
    val address: String?,
    private val engine: WalletKitEngine,
    private val account: WalletAccount?,
) {
    /**
     * Public key of the wallet.
     */
    val publicKey: String? get() = account?.publicKey
    companion object {
        /**
         * Add a new wallet from mnemonic data.
         *
         * **Note:** This method is deprecated. Use `kit.addWallet(data)` instead to stay aligned with the primary kit API.
         *
         * Wallets are automatically persisted by the SDK when persistent storage is enabled.
         *
         * @param kit The TONWalletKit instance
         * @param data Wallet creation data (mnemonic, name, version, network)
         * @return The newly created wallet
         * @throws WalletKitBridgeException if wallet creation fails
         */
        @Deprecated("Use kit.addWallet(data) instead", ReplaceWith("kit.addWallet(data)"))
        suspend fun add(kit: TONWalletKit, data: TONWalletData): TONWallet {
            return kit.addWallet(data)
        }

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
         * @throws WalletKitBridgeException if derivation fails or SDK not initialized
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
         * Generate a new TON mnemonic phrase using the SDK's JS utilities.
         * Defaults to 24 words.
         *
         * @param kit The TONWalletKit instance
         */
        suspend fun generateMnemonic(kit: TONWalletKit, wordCount: Int = 24): List<String> {
            return kit.engine.createTonMnemonic(wordCount)
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
         * @param version Wallet version (e.g., "v4r2", "v5r1")
         * @param network Network to use (default: current network)
         * @return The newly created wallet
         * @throws WalletKitBridgeException if wallet creation fails
         */
        suspend fun addWithSigner(
            kit: TONWalletKit,
            signer: WalletSigner,
            version: String = "v4r2",
            network: TONNetwork = TONNetwork.MAINNET,
        ): TONWallet {
            val account = kit.engine.addWalletWithSigner(
                signer = signer,
                version = version,
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
            return kit.getWallets()
        }
    }

    /**
     * Get the current balance of this wallet.
     *
     * @return Balance in nanoTON as a string, or null if not available
     * @throws WalletKitBridgeException if balance retrieval fails
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
     * @throws WalletKitBridgeException if state init retrieval fails
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
     * @throws WalletKitBridgeException if URL handling fails
     */
    suspend fun connect(url: String) {
        engine.handleTonConnectUrl(url)
    }

    /**
     * Remove this wallet from the wallet kit.
     *
     * This permanently deletes the wallet. Make sure the user has backed up
     * their mnemonic before calling this.
     *
     * @throws WalletKitBridgeException if removal fails
     */
    suspend fun remove() {
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
     * @throws WalletKitBridgeException if transaction retrieval fails
     */
    suspend fun transactions(limit: Int = 10): List<io.ton.walletkit.domain.model.Transaction> {
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
     * @throws WalletKitBridgeException if session retrieval fails
     */
    suspend fun sessions(): List<WalletSession> {
        val addr = address ?: return emptyList()
        // Get all sessions and filter by wallet address
        return engine.listSessions().filter { session ->
            session.walletAddress == addr
        }
    }

    /**
     * Send a locally initiated transaction from this wallet.
     *
     * This creates and sends a transaction with the specified parameters.
     * The transaction will trigger a transaction request event that should be approved by the user.
     *
     * @param recipient Recipient address
     * @param amount Amount in nanoTON as a string
     * @param comment Optional comment/memo for the transaction
     * @throws WalletKitBridgeException if transaction creation or sending fails
     */
    suspend fun sendLocalTransaction(recipient: String, amount: String, comment: String? = null) {
        val addr = address ?: throw WalletKitBridgeException("Wallet address is null")
        engine.sendLocalTransaction(addr, recipient, amount, comment)
    }

    /**
     * Get NFTs owned by this wallet with pagination.
     *
     * Matches the shared API surface for cross-platform consistency.
     *
     * @param limit Maximum number of NFTs to return (default: 100)
     * @param offset Offset for pagination (default: 0)
     * @return NFT items with pagination information
     * @throws WalletKitBridgeException if NFT retrieval fails
     */
    suspend fun nfts(limit: Int = 100, offset: Int = 0): io.ton.walletkit.domain.model.TONNFTItems {
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
    suspend fun nft(nftAddress: String): io.ton.walletkit.domain.model.TONNFTItem? {
        return engine.getNft(nftAddress)
    }

    /**
     * Create an NFT transfer transaction with human-friendly parameters.
     *
     * Matches the shared API surface for cross-platform consistency.
     *
     * @param params Transfer parameters (NFT address, recipient, amount, optional comment)
     * @return Transaction content that can be sent via TON Connect
     * @throws WalletKitBridgeException if transaction creation fails
     */
    suspend fun transferNFT(params: io.ton.walletkit.domain.model.TONNFTTransferParamsHuman): String {
        val addr = address ?: throw WalletKitBridgeException("Wallet address is null")
        return engine.createTransferNftTransaction(addr, params)
    }

    /**
     * Create an NFT transfer transaction with raw parameters.
     *
     * Matches the shared API surface for cross-platform consistency.
     *
     * @param params Raw transfer parameters with full control over transfer message
     * @return Transaction content that can be sent via TON Connect
     * @throws WalletKitBridgeException if transaction creation fails
     */
    suspend fun transferNFT(params: io.ton.walletkit.domain.model.TONNFTTransferParamsRaw): String {
        val addr = address ?: throw WalletKitBridgeException("Wallet address is null")
        return engine.createTransferNftRawTransaction(addr, params)
    }

    /**
     * Send a transaction to the blockchain.
     *
     * This method takes transaction content (usually created by transferNFT, sendLocalTransaction, etc.)
     * and actually sends it to the blockchain, returning the transaction hash.
     *
     * Matches the iOS wallet.sendTransaction() behavior for cross-platform consistency.
     *
     * Example:
     * ```kotlin
     * // Create NFT transfer transaction
     * val txContent = wallet.transferNFT(params)
     * // Send it to blockchain
     * val txHash = wallet.sendTransaction(txContent)
     * ```
     *
     * @param transactionContent Transaction content JSON (from transferNFT, etc.)
     * @return Transaction hash (boc) after successful broadcast
     * @throws WalletKitBridgeException if sending fails
     */
    suspend fun sendTransaction(transactionContent: String): String {
        val addr = address ?: throw WalletKitBridgeException("Wallet address is null")
        return engine.sendTransaction(addr, transactionContent)
    }

    /**
     * Get jetton wallets owned by this wallet with pagination.
     *
     * Matches the shared API surface for cross-platform consistency.
     *
     * @param limit Maximum number of jetton wallets to return (default: 100)
     * @param offset Offset for pagination (default: 0)
     * @return Jetton wallets with pagination information
     * @throws WalletKitBridgeException if jetton retrieval fails
     */
    suspend fun jettonsWallets(limit: Int = 100, offset: Int = 0): io.ton.walletkit.domain.model.TONJettonWallets {
        val addr = address ?: throw WalletKitBridgeException("Wallet address is null")
        return engine.getJettons(addr, limit, offset)
    }

    /**
     * Get a single jetton by its master contract address.
     *
     * Matches the shared API surface for cross-platform consistency.
     *
     * @param jettonAddress Jetton master contract address
     * @return Jetton information or null if not found
     * @throws WalletKitBridgeException if jetton retrieval fails
     */
    suspend fun jetton(jettonAddress: String): io.ton.walletkit.domain.model.TONJetton? {
        return engine.getJetton(jettonAddress)
    }

    /**
     * Create a jetton transfer transaction.
     *
     * Matches the shared API surface for cross-platform consistency.
     *
     * @param params Transfer parameters (recipient address, jetton address, amount, optional comment)
     * @return Transaction content that can be sent via TON Connect
     * @throws WalletKitBridgeException if transaction creation fails
     */
    suspend fun transferJettonTransaction(params: io.ton.walletkit.domain.model.TONJettonTransferParams): String {
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
    suspend fun jettonBalance(jettonAddress: String): String {
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
    suspend fun jettonWalletAddress(jettonAddress: String): String {
        val addr = address ?: throw WalletKitBridgeException("Wallet address is null")
        return engine.getJettonWalletAddress(addr, jettonAddress)
    }
}
