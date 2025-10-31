package io.ton.walletkit.demo.presentation.model

import io.ton.walletkit.domain.model.TONJettonWallet
import java.math.BigDecimal
import java.math.RoundingMode

/**
 * UI-friendly jetton summary model for list display.
 *
 * Maps from [TONJettonWallet] SDK model to presentation layer.
 * Mirrors iOS WalletJettonsListItem structure for cross-platform consistency.
 */
data class JettonSummary(
    val name: String,
    val symbol: String,
    val address: String,
    val balance: String,
    val formattedBalance: String,
    val imageUrl: String?,
    val imageData: String?,
    val estimatedValue: String,
    val jettonWallet: TONJettonWallet,
) {
    companion object {
        /**
         * Create JettonSummary from SDK's TONJettonWallet.
         *
         * @param jettonWallet Jetton wallet from SDK
         * @return UI-friendly jetton summary
         */
        fun from(jettonWallet: TONJettonWallet): JettonSummary {
            val jetton = jettonWallet.jetton

            val name = jetton?.name ?: "Unknown Jetton"
            val symbol = jetton?.symbol ?: "UNKNOWN"
            val address = jettonWallet.address
            val balance = jettonWallet.balance ?: "0"

            // Format balance with decimals
            val formattedBalance = try {
                val decimals = jetton?.decimals ?: 9
                val balanceBigInt = BigDecimal(balance)
                val divisor = BigDecimal.TEN.pow(decimals)
                val formattedValue = balanceBigInt.divide(divisor, decimals, RoundingMode.DOWN)

                // Remove trailing zeros
                val strippedValue = formattedValue.stripTrailingZeros()
                val plainString = strippedValue.toPlainString()

                // Format with symbol
                "$plainString $symbol"
            } catch (e: Exception) {
                "$balance $symbol (raw)"
            }

            val imageUrl = jetton?.image
            val imageData = jetton?.imageData

            // Placeholder for estimated value - would need price data
            val estimatedValue = "≈ $0.00"

            return JettonSummary(
                name = name,
                symbol = symbol,
                address = address,
                balance = balance,
                formattedBalance = formattedBalance,
                imageUrl = imageUrl,
                imageData = imageData,
                estimatedValue = estimatedValue,
                jettonWallet = jettonWallet,
            )
        }
    }
}
