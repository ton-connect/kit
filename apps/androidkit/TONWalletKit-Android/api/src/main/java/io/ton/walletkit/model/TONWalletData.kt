package io.ton.walletkit.model

import kotlinx.serialization.Serializable

/**
 * Data required to create a new wallet.
 *
 * Mirrors the shared TON Wallet Kit data contract for cross-platform consistency.
 *
 * @property mnemonic Mnemonic phrase words (12 or 24 words)
 * @property name User-assigned wallet name
 * @property network Network to create wallet on
 * @property version Wallet contract version (e.g., "v5r1", "v4r2")
 */
@Serializable
data class TONWalletData(
    val mnemonic: List<String>,
    val name: String,
    val network: TONNetwork = TONNetwork.MAINNET,
    val version: String = "v5r1",
)
