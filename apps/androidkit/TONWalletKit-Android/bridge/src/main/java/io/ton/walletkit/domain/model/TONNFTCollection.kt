package io.ton.walletkit.domain.model

import kotlinx.serialization.Serializable

/**
 * NFT collection information.
 *
 * @property address Collection contract address
 * @property codeHash Code hash of the collection contract
 * @property dataHash Data hash of the collection contract
 * @property lastTransactionLt Last transaction logical time
 * @property nextItemIndex Next item index in the collection
 * @property ownerAddress Collection owner address
 */
@Serializable
data class TONNFTCollection(
    val address: String,
    val codeHash: String? = null,
    val dataHash: String? = null,
    val lastTransactionLt: String? = null,
    val nextItemIndex: String,
    val ownerAddress: String? = null,
)
