package io.ton.walletkit.demo.presentation.model

import io.ton.walletkit.presentation.request.TONWalletSignDataRequest
import org.json.JSONObject

data class SignDataRequestUi(
    val id: String,
    val walletAddress: String,
    val dAppName: String? = null,
    val payloadType: String,
    val payloadContent: String,
    val preview: String?,
    val raw: JSONObject,
    val signDataRequest: TONWalletSignDataRequest? = null, // Request object with approve/reject helpers
)
