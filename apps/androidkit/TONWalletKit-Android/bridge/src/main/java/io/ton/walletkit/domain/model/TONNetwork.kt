package io.ton.walletkit.domain.model

import kotlinx.serialization.Serializable

/**
 * TON blockchain network.
 *
 * Mirrors the shared TON Wallet Kit model for cross-platform consistency.
 *
 * @property value Network chain ID
 */
@Serializable
enum class TONNetwork(val value: String) {
    /** Mainnet (chain ID: -239) */
    MAINNET("-239"),

    /** Testnet (chain ID: -3) */
    TESTNET("-3"),
    ;

    companion object {
        /**
         * Parse network from string value.
         * Accepts both chain IDs ("-239", "-3") and names ("mainnet", "testnet").
         *
         * @param value String representation of network
         * @return TONNetwork enum or null if invalid
         */
        fun fromString(value: String): TONNetwork? = when (value.lowercase()) {
            "-239", "mainnet" -> MAINNET
            "-3", "testnet" -> TESTNET
            else -> null
        }
    }
}
