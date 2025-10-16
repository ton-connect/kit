package io.ton.walletkit.presentation

import io.ton.walletkit.domain.model.TONWalletData
import io.ton.walletkit.domain.model.WalletAccount

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
 */
class TONWallet private constructor(
    val address: String?,
    private val engine: WalletKitEngine,
    private val account: WalletAccount?,
) {
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
    suspend fun sessions(): List<io.ton.walletkit.domain.model.WalletSession> {
        val addr = address ?: return emptyList()
        // Get all sessions and filter by wallet address
        return engine.listSessions().filter { session ->
            session.walletAddress == addr
        }
    }
}
