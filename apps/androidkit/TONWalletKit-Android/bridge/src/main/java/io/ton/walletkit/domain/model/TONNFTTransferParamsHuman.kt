package io.ton.walletkit.domain.model

import kotlinx.serialization.Serializable

/**
 * Human-friendly NFT transfer parameters.
 *
 * @property nftAddress NFT contract address to transfer
 * @property transferAmount Amount of TON to attach to the transfer (for gas fees)
 * @property toAddress Recipient wallet address
 * @property comment Optional comment/memo for the transfer
 */
@Serializable
data class TONNFTTransferParamsHuman(
    val nftAddress: String,
    val transferAmount: String,
    val toAddress: String,
    val comment: String? = null,
)
