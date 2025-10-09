package io.ton.walletkit.demo.model

import org.json.JSONObject
import java.math.BigDecimal
import java.math.RoundingMode

data class TransactionRequestUi(
    val id: String,
    val walletAddress: String,
    val dAppName: String,
    val validUntil: Long?,
    val messages: List<TransactionMessageUi>,
    val preview: String?,
    val raw: JSONObject,
) {
    /**
     * Parse preview to extract fee information
     * Returns null if preview is not available or parsing fails
     */
    fun getPreviewData(): TransactionPreviewData? {
        val previewStr = preview ?: return null
        return try {
            val previewJson = JSONObject(previewStr)
            val result = previewJson.optString("result")

            if (result != "success") {
                val errorObj = previewJson.optJSONObject("emulationError")
                val errorMessage = errorObj?.optString("message") ?: "Emulation failed"
                return TransactionPreviewData.Error(errorMessage)
            }

            val moneyFlow = previewJson.optJSONObject("moneyFlow")
            if (moneyFlow != null) {
                val outputs = moneyFlow.optString("outputs", "0")
                val inputs = moneyFlow.optString("inputs", "0")

                // Calculate total amount from messages
                val totalAmount = messages.sumOf {
                    it.amount.toBigDecimalOrNull() ?: BigDecimal.ZERO
                }

                // Fee = outputs - amount
                val outputsNano = BigDecimal(outputs)
                val feeNano = outputsNano - totalAmount

                TransactionPreviewData.Success(
                    totalOutputNano = outputs,
                    totalInputNano = inputs,
                    feeNano = feeNano.max(BigDecimal.ZERO).toPlainString(),
                    feeTon = formatNanoToTon(feeNano),
                    totalCostTon = formatNanoToTon(outputsNano),
                )
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }

    private fun formatNanoToTon(nanotons: BigDecimal): String = nanotons
        .divide(BigDecimal("1000000000"), 9, RoundingMode.DOWN)
        .stripTrailingZeros()
        .toPlainString()
}

sealed class TransactionPreviewData {
    data class Success(
        val totalOutputNano: String,
        val totalInputNano: String,
        val feeNano: String,
        val feeTon: String,
        val totalCostTon: String,
    ) : TransactionPreviewData()

    data class Error(val message: String) : TransactionPreviewData()
}
