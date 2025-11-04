package io.ton.walletkit.demo.presentation.model

import io.ton.walletkit.model.TONNFTItem
import kotlinx.serialization.json.jsonPrimitive

/**
 * UI-friendly NFT details model.
 *
 * Maps from [TONNFTItem] SDK model to presentation layer.
 * Mirrors iOS WalletNFTDetails structure for cross-platform consistency.
 */
data class NFTDetails(
    val name: String,
    val description: String?,
    val imageUrl: String?,
    val collectionName: String?,
    val index: String?,
    val status: String?,
    val contractAddress: String,
    val ownerAddress: String?,
    val canTransfer: Boolean,
) {
    companion object {
        /**
         * Create NFTDetails from SDK's TONNFTItem.
         *
         * @param nftItem NFT item from SDK
         * @return UI-friendly NFT details
         */
        fun from(nftItem: TONNFTItem): NFTDetails {
            val name = nftItem.metadata?.name ?: "Unknown NFT"
            val description = nftItem.metadata?.description

            // Try to get medium image from extra, fallback to standard image
            val imageUrl = try {
                nftItem.metadata?.extra?.get("_image_medium")?.jsonPrimitive?.content
                    ?: nftItem.metadata?.image
            } catch (e: Exception) {
                nftItem.metadata?.image
            }

            // Collection address as name since TONNFTCollection doesn't have a name field
            val collectionName = nftItem.collection?.address?.take(8)?.let { "$it..." }

            val index = nftItem.metadata?.nftIndex

            val status = if (nftItem.onSale == true) "On Sale" else "Not on Sale"

            val contractAddress = nftItem.address

            val ownerAddress = nftItem.ownerAddress ?: nftItem.realOwner

            // Can only transfer if not on sale and has owner
            val canTransfer = nftItem.onSale != true && nftItem.ownerAddress != null

            return NFTDetails(
                name = name,
                description = description,
                imageUrl = imageUrl,
                collectionName = collectionName,
                index = index,
                status = status,
                contractAddress = contractAddress,
                ownerAddress = ownerAddress,
                canTransfer = canTransfer,
            )
        }
    }
}
