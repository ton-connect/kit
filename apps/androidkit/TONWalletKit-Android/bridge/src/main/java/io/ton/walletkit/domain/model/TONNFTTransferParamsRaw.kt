package io.ton.walletkit.domain.model

import kotlinx.serialization.Serializable

/**
 * Low-level NFT transfer message.
 *
 * @property queryId Query ID for the transfer
 * @property newOwner New owner address
 * @property responseDestination Response destination address (for excess funds)
 * @property customPayload Custom payload (optional)
 * @property forwardAmount Amount to forward to the new owner
 * @property forwardPayload Forward payload (optional)
 */
@Serializable
data class TONNFTTransferMessageDTO(
    val queryId: String,
    val newOwner: String,
    val responseDestination: String? = null,
    val customPayload: String? = null,
    val forwardAmount: String,
    val forwardPayload: String? = null,
)

/**
 * Raw (advanced) NFT transfer parameters.
 *
 * Matches the shared TONNFTTransferParamsRaw structure for cross-platform consistency.
 *
 * @property nftAddress NFT contract address to transfer
 * @property transferAmount Amount of TON to attach to the transfer (for gas fees)
 * @property transferMessage Detailed transfer message with all parameters
 */
@Serializable
data class TONNFTTransferParamsRaw(
    val nftAddress: String,
    val transferAmount: String,
    val transferMessage: TONNFTTransferMessageDTO,
)
