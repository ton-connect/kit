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
class TONWallet private constructor(
    val address: String?,
    private val engine: WalletKitEngine,
    private val account: WalletAccount?,
) {
    /**
     * Public key of the wallet.
     */
    val publicKey: String? get() = account?.publicKey
    companion object {
        private const val ERROR_WALLETKIT_NOT_INITIALIZED = "TONWalletKit not initialized. Call TONWalletKit.initialize() first."

        /**
         * Add a new wallet from mnemonic data.
         *
         * Wallets are automatically persisted by the SDK when persistent storage is enabled.
         * Use [wallets] to retrieve all persisted wallets on app startup.
         *
         * @param data Wallet creation data (mnemonic, name, version, network)
         * @return The newly created wallet
         * @throws WalletKitBridgeException if wallet creation fails or SDK not initialized
         */
        suspend fun add(data: TONWalletData): TONWallet {
            val engine = TONWalletKit.engine
                ?: throw WalletKitBridgeException(ERROR_WALLETKIT_NOT_INITIALIZED)

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
         * Derive a public key from a mnemonic phrase without creating a wallet.
         *
         * This is useful for external signers (hardware wallets, watch-only wallets)
         * where you need the public key but don't want to store the mnemonic.
         *
         * Example:
         * ```kotlin
         * val mnemonic = listOf("word1", "word2", ..., "word24")
         * val publicKey = TONWallet.derivePublicKey(mnemonic)
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
        suspend fun derivePublicKey(mnemonic: List<String>): String {
            val engine = TONWalletKit.engine
                ?: throw WalletKitBridgeException(ERROR_WALLETKIT_NOT_INITIALIZED)

            return engine.derivePublicKeyFromMnemonic(mnemonic)
        }

        /**
         * Generate a new TON mnemonic phrase using the SDK's JS utilities.
         * Defaults to 24 words.
         */
        suspend fun generateMnemonic(wordCount: Int = 24): List<String> {
            val engine = TONWalletKit.engine
                ?: throw WalletKitBridgeException(ERROR_WALLETKIT_NOT_INITIALIZED)

            return engine.createTonMnemonic(wordCount)
        }

        /**
         * Add a new wallet using an external signer.
         *
         * Use this method to create wallets where the private key is managed externally,
         * such as hardware wallets, watch-only wallets, or separate secure modules.
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
         * @param signer The external signer that will handle all signing operations
         * @param version Wallet version (e.g., "v4r2", "v5r1")
         * @param network Network to use (default: current network)
         * @return The newly created wallet
         * @throws WalletKitBridgeException if wallet creation fails or SDK not initialized
         */
        suspend fun addWithSigner(
            signer: WalletSigner,
            version: String = "v4r2",
            network: TONNetwork = TONNetwork.MAINNET,
        ): TONWallet {
            val engine = TONWalletKit.engine
                ?: throw WalletKitBridgeException(ERROR_WALLETKIT_NOT_INITIALIZED)

            val account = engine.addWalletWithSigner(
                signer = signer,
                version = version,
                network = network.value,
            )

            return TONWallet(
                address = account.address,
                engine = engine,
                account = account,
            )
        }

        /**
         * Get all wallets managed by the SDK.
         *
         * When persistent storage is enabled (default), wallets are automatically saved
         * and will be available across app restarts. Call this method on app startup
         * to retrieve previously created wallets.
         *
         * @return List of all wallets
         * @throws WalletKitBridgeException if SDK not initialized
         */
        suspend fun wallets(): List<TONWallet> {
            val engine = TONWalletKit.engine
                ?: throw WalletKitBridgeException(ERROR_WALLETKIT_NOT_INITIALIZED)

            val accounts = engine.getWallets()
            return accounts.map { account ->
                TONWallet(
                    address = account.address,
                    engine = engine,
                    account = account,
                )
            }
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
}
