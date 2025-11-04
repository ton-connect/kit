package io.ton.walletkit.model

import kotlinx.serialization.Serializable

/**
 * Pagination information for NFT list.
 *
 * @property offset Current offset in the list
 * @property limit Number of items per page
 * @property pages Total number of pages (optional)
 */
@Serializable
data class TONPagination(
    val offset: Int,
    val limit: Int,
    val pages: Int? = null,
)
