package io.ton.walletkit.model

import kotlinx.serialization.Serializable

/**
 * Information about a decentralized application (dApp) requesting wallet interaction.
 *
 * This model represents metadata about a dApp that is initiating a connection,
 * transaction, or data signing request with the wallet. It's used throughout
 * the SDK to provide context about which application is making requests.
 *
 * @property name Display name of the dApp (e.g., "TON Wallet")
 * @property url Main URL of the dApp (e.g., "https://wallet.ton.org")
 * @property iconUrl Optional URL to the dApp's icon/logo for display purposes
 * @property manifestUrl Optional URL to the TON Connect manifest file containing dApp metadata
 */
@Serializable
data class DAppInfo(
    val name: String,
    val url: String,
    val iconUrl: String? = null,
    val manifestUrl: String? = null,
)
