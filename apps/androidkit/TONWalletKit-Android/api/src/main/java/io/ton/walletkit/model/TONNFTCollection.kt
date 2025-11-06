package io.ton.walletkit.model

import kotlinx.serialization.Serializable

/**
 * NFT collection information.
 *
 * @property address Collection contract address (user-friendly format: UQ... or EQ...)
 * @property codeHash Code hash of the collection contract (hex string with 0x prefix)
 * @property dataHash Data hash of the collection contract (hex string with 0x prefix)
 * @property lastTransactionLt Last transaction logical time
 * @property nextItemIndex Next item index in the collection
 * @property ownerAddress Collection owner address (user-friendly format)
 */
@Serializable
data class TONNFTCollection(
    /** Collection contract address (user-friendly format: UQ... or EQ...) */
    val address: String,
    /** Code hash of the collection contract (hex string with 0x prefix) */
    val codeHash: String? = null,
    /** Data hash of the collection contract (hex string with 0x prefix) */
    val dataHash: String? = null,
    val lastTransactionLt: String? = null,
    val nextItemIndex: String,
    /** Collection owner address (user-friendly format) */
    val ownerAddress: String? = null,
)
