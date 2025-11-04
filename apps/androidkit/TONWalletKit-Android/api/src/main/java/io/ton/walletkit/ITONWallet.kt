package io.ton.walletkit

import io.ton.walletkit.config.SignDataType
import io.ton.walletkit.model.*

/**
 * Represents a TON wallet instance with operations for transaction management.
 */
interface ITONWallet {
    /**
     * The wallet's TON address (user-friendly format).
     */
    val address: String?

    /**
     * The wallet's public key (hex-encoded).
     */
    val publicKey: String?

    /**
     * Get the current balance of this wallet.
     */
    suspend fun getBalance(): String

    /**
     * Get recent transactions for this wallet.
     */
    suspend fun getRecentTransactions(limit: Int = 20): List<Transaction>

    /**
     * Create a simple TON transfer transaction.
     */
    suspend fun createTransferTonTransaction(params: TONTransferParams): String

    /**
     * Create a multi-destination TON transfer transaction.
     */
    suspend fun createTransferMultiTonTransaction(messages: List<TONTransferParams>): String

    /**
     * Get NFT items owned by this wallet.
     */
    suspend fun getNFTItems(
        limit: Int? = null,
        offset: Int? = null,
        collectionAddress: String? = null,
        indirectOwnership: Boolean? = null,
    ): TONNFTItems

    /**
     * Get Jetton wallets owned by this wallet.
     */
    suspend fun getJettons(
        limit: Int? = null,
        offset: Int? = null,
    ): TONJettonWallets

    /**
     * Get Jetton wallets owned by this wallet (alternative name for compatibility).
     */
    suspend fun jettons(limit: Int = 100, offset: Int = 0): TONJettonWallets =
        getJettons(limit, offset)

    /**
     * Get NFT items owned by this wallet (alternative name for compatibility).
     */
    suspend fun nfts(limit: Int = 100, offset: Int = 0): TONNFTItems =
        getNFTItems(limit, offset, null, null)

    /**
     * Get recent transactions (alternative name for compatibility).
     */
    suspend fun transactions(limit: Int = 10): List<Transaction> =
        getRecentTransactions(limit)

    /**
     * Get wallet sessions with connected dApps.
     */
    suspend fun sessions(): List<WalletSession>

    /**
     * Create an NFT transfer transaction.
     */
    suspend fun createTransferNFTTransaction(params: TONNFTTransferParamsHuman): String

    /**
     * Create a Jetton transfer transaction.
     */
    suspend fun createTransferJettonTransaction(params: TONJettonTransferParams): String

    /**
     * Send a prepared transaction.
     */
    suspend fun sendTransaction(transactionContent: String): String

    /**
     * Get a preview/emulation of a transaction before sending.
     */
    suspend fun getTransactionPreview(transactionContent: String): TONTransactionPreview

    /**
     * Connect to a dApp using a TON Connect URL.
     */
    suspend fun connect(url: String)

    /**
     * Sign arbitrary data with this wallet's private key.
     */
    suspend fun signData(
        data: ByteArray,
        type: SignDataType = SignDataType.BINARY,
    ): SignDataResult

    /**
     * Disconnect this wallet from all connected dApps.
     */
    suspend fun disconnect()

    /**
     * Remove this wallet from the SDK.
     */
    suspend fun remove()
}
