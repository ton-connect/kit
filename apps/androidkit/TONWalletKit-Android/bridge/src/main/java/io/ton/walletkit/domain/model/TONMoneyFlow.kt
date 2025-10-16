package io.ton.walletkit.domain.model

import kotlinx.serialization.Serializable

/**
 * Represents a single money transfer row in a transaction.
 *
 * Mirrors the shared TON Wallet Kit model for cross-platform consistency.
 *
 * @property type Asset type (TON or Jetton)
 * @property jetton Jetton address if type is JETTON
 * @property from Sender address
 * @property to Recipient address
 * @property amount Transfer amount
 */
@Serializable
data class TONMoneyFlowRow(
    val type: TONAssetType,
    val jetton: String? = null,
    val from: String? = null,
    val to: String? = null,
    val amount: String? = null,
)

/**
 * Represents a transfer involving the wallet owner.
 *
 * Mirrors the shared TON Wallet Kit model for cross-platform consistency.
 *
 * @property type Asset type (TON or Jetton)
 * @property jetton Jetton address if type is JETTON
 * @property amount Transfer amount
 */
@Serializable
data class TONMoneyFlowSelf(
    val type: TONAssetType,
    val jetton: String? = null,
    val amount: String,
)

/**
 * Analysis of money flow in a transaction.
 *
 * Mirrors the shared TON Wallet Kit model for cross-platform consistency.
 *
 * @property outputs Total outgoing amount in nanoTON
 * @property inputs Total incoming amount in nanoTON
 * @property allJettonTransfers All jetton transfers in transaction
 * @property ourTransfers Transfers involving our wallet
 * @property ourAddress Our wallet address
 */
@Serializable
data class TONMoneyFlow(
    val outputs: String? = null,
    val inputs: String? = null,
    val allJettonTransfers: List<TONMoneyFlowRow>? = null,
    val ourTransfers: List<TONMoneyFlowSelf>? = null,
    val ourAddress: String? = null,
)
