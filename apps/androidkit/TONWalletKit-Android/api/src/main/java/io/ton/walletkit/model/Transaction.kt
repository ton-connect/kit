package io.ton.walletkit.model

/**
 * Represents a blockchain transaction.
 *
 * @property hash Unique transaction hash
 * @property timestamp Transaction timestamp in milliseconds
 * @property amount Transaction amount in nanoTON
 * @property fee Transaction fee in nanoTON (nullable if not yet confirmed)
 * @property comment Optional comment/message attached to the transaction
 * @property sender Sender address (nullable for outgoing transactions)
 * @property recipient Recipient address (nullable for incoming transactions)
 * @property type Type of transaction (incoming, outgoing, or unknown)
 * @property lt Logical time - transaction ordering in the blockchain
 * @property blockSeqno Block sequence number where transaction was included
 */
data class Transaction(
    val hash: String,
    val timestamp: Long,
    val amount: String,
    val fee: String? = null,
    val comment: String? = null,
    val sender: String? = null,
    val recipient: String? = null,
    val type: TransactionType = TransactionType.UNKNOWN,
    val lt: String? = null,
    val blockSeqno: Int? = null,
)
