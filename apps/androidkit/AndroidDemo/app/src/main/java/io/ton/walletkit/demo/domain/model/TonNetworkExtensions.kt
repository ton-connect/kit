package io.ton.walletkit.demo.domain.model

import io.ton.walletkit.domain.model.TONNetwork

private const val BRIDGE_MAINNET = "mainnet"
private const val BRIDGE_TESTNET = "testnet"

/**
 * Convert SDK network enum to the string value we persist in demo storage.
 */
fun TONNetwork.toBridgeValue(): String = when (this) {
    TONNetwork.MAINNET -> BRIDGE_MAINNET
    TONNetwork.TESTNET -> BRIDGE_TESTNET
}

/**
 * Parse a persisted network string (bridge manifest style or chain id) into SDK enum.
 */
fun String?.toTonNetwork(fallback: TONNetwork = TONNetwork.MAINNET): TONNetwork {
    val normalized = this?.trim()?.lowercase()
    return when (normalized) {
        BRIDGE_MAINNET -> TONNetwork.MAINNET
        BRIDGE_TESTNET -> TONNetwork.TESTNET
        null, "" -> fallback
        else -> TONNetwork.fromString(normalized) ?: fallback
    }
}
