package io.ton.walletkit.model

/**
 * Represents a wallet account managed by WalletKit.
 *
 * @property address Wallet address
 * @property publicKey Public key of the wallet (nullable if not available)
 * @property name User-assigned name for the wallet (nullable)
 * @property version Wallet version (e.g., "v5r1", "v4r2")
 * @property network Network the wallet operates on (e.g., "mainnet", "testnet")
 * @property index Wallet derivation index
 */
data class WalletAccount(
    val address: String,
    val publicKey: String?,
    val name: String? = null,
    val version: String,
    val network: String,
    val index: Int,
)
