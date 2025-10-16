package io.ton.walletkit.domain.model

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
    @SerialName("ton")
    TON,

    /** Jetton token */
    @SerialName("jetton")
    JETTON,
}
