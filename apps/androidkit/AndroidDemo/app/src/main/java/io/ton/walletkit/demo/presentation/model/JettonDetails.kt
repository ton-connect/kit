package io.ton.walletkit.demo.presentation.model

import io.ton.walletkit.model.TONJettonWallet
import java.math.BigDecimal
import java.math.RoundingMode

/**
 * UI-friendly detailed jetton information model.
 *
 * Maps from [TONJettonWallet] SDK model to presentation layer for detail view.
 */
data class JettonDetails(
    val name: String,
    val symbol: String,
    val description: String?,
    val jettonAddress: String?,
    val walletAddress: String,
    val balance: String,
    val formattedBalance: String,
    val decimals: Int,
    val totalSupply: String?,
    val imageUrl: String?,
    val imageData: String?,
    val verified: Boolean,
    val verificationSource: String?,
    val warnings: List<String>?,
) {
    companion object {
        /**
         * Create JettonDetails from SDK's TONJettonWallet.
         *
         * @param jettonWallet Jetton wallet from SDK
         * @return UI-friendly jetton details
         */
        fun from(jettonWallet: TONJettonWallet): JettonDetails {
            val jetton = jettonWallet.jetton

            val name = jetton?.name ?: "Unknown Jetton"
            val symbol = jetton?.symbol ?: "UNKNOWN"
            val description = jetton?.description
            val jettonAddress = jettonWallet.jettonAddress
            val walletAddress = jettonWallet.address
            val balance = jettonWallet.balance ?: "0"
            val decimals = jetton?.decimals ?: 9

            // Format balance with decimals
            val formattedBalance = try {
                val balanceBigInt = BigDecimal(balance)
                val divisor = BigDecimal.TEN.pow(decimals)
                val formattedValue = balanceBigInt.divide(divisor, decimals, RoundingMode.DOWN)
                formattedValue.stripTrailingZeros().toPlainString()
            } catch (e: Exception) {
                balance
            }

            val totalSupply = jetton?.totalSupply
            val imageUrl = jetton?.image
            val imageData = jetton?.imageData

            val verification = jetton?.verification
            val verified = verification?.verified ?: false
            val verificationSource = verification?.source?.name?.lowercase()
            val warnings = verification?.warnings

            return JettonDetails(
                name = name,
                symbol = symbol,
                description = description,
                jettonAddress = jettonAddress,
                walletAddress = walletAddress,
                balance = balance,
                formattedBalance = formattedBalance,
                decimals = decimals,
                totalSupply = totalSupply,
                imageUrl = imageUrl,
                imageData = imageData,
                verified = verified,
                verificationSource = verificationSource,
                warnings = warnings,
            )
        }
    }
}
