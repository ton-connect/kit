package io.ton.walletkit.domain.model

import kotlinx.serialization.Serializable

/**
 * NFT items list with pagination.
 *
 * @property items List of NFT items
 * @property pagination Pagination information
 */
@Serializable
data class TONNFTItems(
    val items: List<TONNFTItem>,
    val pagination: TONPagination,
)
