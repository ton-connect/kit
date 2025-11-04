package io.ton.walletkit.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Jetton wallets list with pagination and metadata.
 *
 * Response from fetching jettons by owner address.
 *
 * @property items List of jetton wallets
 * @property addressBook Address book for user-friendly addresses
 * @property metadata Additional metadata for addresses
 * @property pagination Pagination information
 */
@Serializable
data class TONJettonWallets(
    @SerialName("jettons")
    val items: List<TONJettonWallet>,
    @SerialName("address_book")
    val addressBook: Map<String, TONEmulationAddressBookEntry>? = null,
    val metadata: Map<String, TONEmulationAddressMetadata>? = null,
    val pagination: TONPagination? = null,
)
