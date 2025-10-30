package io.ton.walletkit.domain.model

import kotlinx.serialization.Serializable

/**
 * Limit and offset parameters for paginated requests.
 *
 * @property limit Maximum number of items to return
 * @property offset Offset from the beginning of the list
 */
@Serializable
data class TONLimitRequest(
    val limit: Int? = null,
    val offset: Int? = null,
)
