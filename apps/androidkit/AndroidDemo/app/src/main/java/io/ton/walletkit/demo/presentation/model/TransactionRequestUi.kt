package io.ton.walletkit.demo.presentation.model

import io.ton.walletkit.request.TONWalletTransactionRequest
import org.json.JSONObject

data class TransactionRequestUi(
    val id: String,
    val walletAddress: String,
    val dAppName: String,
    val validUntil: Long?,
    val messages: List<TransactionMessageUi>,
    val preview: String?,
    val raw: JSONObject,
    val transactionRequest: TONWalletTransactionRequest? = null, // Request object with approve/reject helpers
)
