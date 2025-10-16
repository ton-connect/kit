package io.ton.walletkit.demo.presentation.model

data class TransactionMessageUi(
    val to: String,
    val amount: String,
    val comment: String?,
    val payload: String?,
    val stateInit: String?,
)
