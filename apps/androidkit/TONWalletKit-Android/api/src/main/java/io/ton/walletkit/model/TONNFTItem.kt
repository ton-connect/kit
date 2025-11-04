package io.ton.walletkit.model

import kotlinx.serialization.Serializable

/**
 * NFT item (token) information.
 *
 * @property address NFT contract address
 * @property auctionContractAddress Auction contract address (if NFT is on auction)
 * @property codeHash Code hash of the NFT contract
 * @property dataHash Data hash of the NFT contract
 * @property collection Collection information (if part of a collection)
 * @property collectionAddress Collection contract address
 * @property metadata Token metadata (name, image, description, etc.)
 * @property index NFT index in the collection
 * @property initFlag Whether the NFT contract is initialized
 * @property lastTransactionLt Last transaction logical time
 * @property onSale Whether the NFT is currently on sale
 * @property ownerAddress Current owner address
 * @property realOwner Real owner address (may differ from ownerAddress for sale contracts)
 * @property saleContractAddress Sale contract address (if NFT is on sale)
 */
@Serializable
data class TONNFTItem(
    val address: String,
    val auctionContractAddress: String? = null,
    val codeHash: String? = null,
    val dataHash: String? = null,
    val collection: TONNFTCollection? = null,
    val collectionAddress: String? = null,
    val metadata: TONTokenInfo? = null,
    val index: String? = null,
    val initFlag: Boolean? = null,
    val lastTransactionLt: String? = null,
    val onSale: Boolean? = null,
    val ownerAddress: String? = null,
    val realOwner: String? = null,
    val saleContractAddress: String? = null,
)
