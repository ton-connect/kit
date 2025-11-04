package io.ton.walletkit.model

/**
 * Represents a transaction request initiated by a dApp.
 *
 * This model contains all the necessary information to construct and send
 * a blockchain transaction. It's typically received from a dApp through
 * the TON Connect protocol.
 *
 * @property recipient The destination wallet address on the TON blockchain
 * @property amount Transaction amount in nanoTON (1 TON = 1,000,000,000 nanoTON)
 * @property comment Optional text comment/memo attached to the transaction
 * @property payload Optional raw cell payload for complex contract interactions
 */
data class TransactionRequest(
    val recipient: String,
    val amount: String,
    val comment: String? = null,
    val payload: String? = null,
)
