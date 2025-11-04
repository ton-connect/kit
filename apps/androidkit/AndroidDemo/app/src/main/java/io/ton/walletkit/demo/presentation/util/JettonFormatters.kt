package io.ton.walletkit.demo.presentation.util

import java.math.BigDecimal
import java.math.RoundingMode

/**
 * Utility functions for formatting jetton-related values.
 */
object JettonFormatters {

    /**
     * Format jetton balance with proper decimals.
     *
     * @param balance Raw balance string
     * @param decimals Number of decimal places
     * @param maxDecimals Maximum decimals to display (default: 4)
     * @return Formatted balance string
     */
    fun formatBalance(balance: String, decimals: Int, maxDecimals: Int = 4): String = try {
        val balanceBigInt = BigDecimal(balance)
        val divisor = BigDecimal.TEN.pow(decimals)
        val formattedValue = balanceBigInt.divide(divisor, decimals, RoundingMode.DOWN)

        // Limit displayed decimals
        val displayDecimals = minOf(decimals, maxDecimals)
        val scaledValue = formattedValue.setScale(displayDecimals, RoundingMode.DOWN)

        // Remove trailing zeros
        scaledValue.stripTrailingZeros().toPlainString()
    } catch (e: Exception) {
        balance
    }

    /**
     * Format jetton balance with symbol.
     *
     * @param balance Raw balance string
     * @param symbol Jetton symbol
     * @param decimals Number of decimal places
     * @return Formatted balance with symbol
     */
    fun formatBalanceWithSymbol(balance: String, symbol: String, decimals: Int): String {
        val formatted = formatBalance(balance, decimals)
        return "$formatted $symbol"
    }

    /**
     * Format large numbers with K, M, B notation.
     *
     * @param value Numeric value
     * @return Formatted string (e.g., "1.2K", "3.4M", "5.6B")
     */
    fun formatLargeNumber(value: String): String = try {
        val number = BigDecimal(value)
        when {
            number >= BigDecimal("1000000000") -> {
                val billions = number.divide(BigDecimal("1000000000"), 1, RoundingMode.DOWN)
                "${billions.stripTrailingZeros().toPlainString()}B"
            }
            number >= BigDecimal("1000000") -> {
                val millions = number.divide(BigDecimal("1000000"), 1, RoundingMode.DOWN)
                "${millions.stripTrailingZeros().toPlainString()}M"
            }
            number >= BigDecimal("1000") -> {
                val thousands = number.divide(BigDecimal("1000"), 1, RoundingMode.DOWN)
                "${thousands.stripTrailingZeros().toPlainString()}K"
            }
            else -> number.stripTrailingZeros().toPlainString()
        }
    } catch (e: Exception) {
        value
    }

    /**
     * Format USD value estimate.
     *
     * @param usdValue USD value as string
     * @return Formatted USD string (e.g., "$1,234.56")
     */
    fun formatUsdValue(usdValue: String): String = try {
        val value = BigDecimal(usdValue)
        val formatted = value.setScale(2, RoundingMode.HALF_UP)
        "$$formatted"
    } catch (e: Exception) {
        "$$usdValue"
    }

    /**
     * Format address by truncating middle.
     *
     * @param address Full address
     * @param startChars Characters to show at start (default: 4)
     * @param endChars Characters to show at end (default: 4)
     * @return Truncated address (e.g., "EQCa...vXYZ")
     */
    fun formatAddress(address: String, startChars: Int = 4, endChars: Int = 4): String {
        if (address.length <= startChars + endChars) {
            return address
        }
        val start = address.take(startChars)
        val end = address.takeLast(endChars)
        return "$start...$end"
    }
}
