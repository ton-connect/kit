package io.ton.walletkit.domain.model

import io.ton.walletkit.domain.constants.JsonConstants
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Type of TON asset.
 *
 * Mirrors the shared TON Wallet Kit model for cross-platform consistency.
 */
@Serializable
enum class TONAssetType {
    /** Native TON currency */
    @SerialName(JsonConstants.VALUE_ASSET_TON)
    TON,

    /** Jetton token */
    @SerialName(JsonConstants.VALUE_ASSET_JETTON)
    JETTON,
}
