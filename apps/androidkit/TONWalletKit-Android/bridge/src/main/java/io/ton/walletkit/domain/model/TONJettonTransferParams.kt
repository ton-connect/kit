package io.ton.walletkit.domain.model

import kotlinx.serialization.Serializable

/**
 * Parameters for transferring jettons.
 *
 * @property toAddress Recipient wallet address
 * @property jettonAddress Jetton master contract address
 * @property amount Amount of jettons to transfer (in jetton units, not considering decimals)
 * @property comment Optional comment/memo for the transfer
 */
@Serializable
data class TONJettonTransferParams(
    val toAddress: String,
    val jettonAddress: String,
    val amount: String,
    val comment: String? = null,
)
