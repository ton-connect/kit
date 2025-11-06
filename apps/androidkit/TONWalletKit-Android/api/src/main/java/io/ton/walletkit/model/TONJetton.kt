package io.ton.walletkit.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

/**
 * Jetton (fungible token) information.
 *
 * Represents the metadata and configuration of a Jetton master contract.
 *
 * @property address Jetton master contract address (user-friendly format: UQ... or EQ...)
 * @property name Jetton name (e.g., "Tether USD")
 * @property symbol Jetton symbol (e.g., "USDT")
 * @property description Jetton description
 * @property decimals Number of decimal places (typically 9)
 * @property totalSupply Total supply of the jetton
 * @property image URL to jetton image/logo
 * @property imageData Base64-encoded image data
 * @property uri URI to jetton metadata
 * @property verification Verification status
 * @property metadata Additional metadata as key-value pairs
 */
@Serializable
data class TONJetton(
    /** Jetton master contract address (user-friendly format: UQ... or EQ...) */
    val address: String? = null,
    val name: String? = null,
    val symbol: String? = null,
    val description: String? = null,
    val decimals: Int? = null,
    @SerialName("total_supply")
    val totalSupply: String? = null,
    val image: String? = null,
    @SerialName("image_data")
    val imageData: String? = null,
    val uri: String? = null,
    val verification: TONJettonVerification? = null,
    val metadata: Map<String, JsonElement>? = null,
)
