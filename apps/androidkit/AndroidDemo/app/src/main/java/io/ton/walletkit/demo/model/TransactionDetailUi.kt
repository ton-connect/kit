package io.ton.walletkit.demo.model

data class TransactionDetailUi(
    val hash: String,
    val timestamp: Long,
    val isOutgoing: Boolean,
    val amount: String,
    val fee: String,
    val fromAddress: String?,
    val toAddress: String?,
    val comment: String?,
    val status: String,
    val blockSeqno: Int,
    val lt: String,
)
