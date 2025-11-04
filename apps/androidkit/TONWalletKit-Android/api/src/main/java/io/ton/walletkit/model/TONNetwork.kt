package io.ton.walletkit.model

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
        private const val CHAIN_ID_MAINNET = "-239"
        private const val CHAIN_ID_TESTNET = "-3"
        private const val NAME_MAINNET = "mainnet"
        private const val NAME_TESTNET = "testnet"

        /**
         * Parse network from string value.
         * Accepts both chain IDs ("-239", "-3") and names ("mainnet", "testnet").
         *
         * @param value String representation of network
         * @return TONNetwork enum or null if invalid
         */
        fun fromString(value: String): TONNetwork? = when (value.lowercase()) {
            CHAIN_ID_MAINNET, NAME_MAINNET -> MAINNET
            CHAIN_ID_TESTNET, NAME_TESTNET -> TESTNET
            else -> null
        }
    }
}
