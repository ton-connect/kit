package io.ton.walletkit.model

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject

/**
 * Token metadata information.
 *
 * @property description Token or NFT description
 * @property image Image URL
 * @property name Token or NFT name
 * @property nftIndex NFT index in collection (for NFTs)
 * @property symbol Token symbol
 * @property type Token type
 * @property valid Whether the metadata is valid
 * @property extra Extra metadata fields (e.g., _image_medium, _image_big, _image_small, uri, etc.)
 */
@Serializable
data class TONTokenInfo(
    val description: String? = null,
    val image: String? = null,
    val name: String? = null,
    val nftIndex: String? = null,
    val symbol: String? = null,
    val type: String? = null,
    val valid: Boolean? = null,
    val extra: JsonObject? = null,
)
