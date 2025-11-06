package io.ton.walletkit.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient

/**
 * Jetton wallet information with embedded jetton metadata.
 *
 * Represents a user's jetton wallet contract that holds jetton tokens.
 * The JavaScript bridge returns a flattened structure combining wallet and jetton info.
 *
 * @property walletAddress Jetton wallet contract address (user-friendly format: UQ... or EQ...)
 * @property balance Balance of jettons in this wallet
 * @property owner Owner wallet address (user-friendly format)
 * @property jettonAddress Jetton master contract address (user-friendly format)
 * @property name Jetton name (e.g., "Tether USD")
 * @property symbol Jetton symbol (e.g., "USD₮")
 * @property description Jetton description
 * @property decimals Number of decimal places
 * @property image URL to jetton image/logo
 * @property imageData Base64-encoded image data
 * @property uri URI to jetton metadata
 * @property verification Verification status
 * @property usdValue USD value of the balance
 * @property lastActivity Last activity timestamp
 * @property lastTransactionLt Last transaction logical time
 * @property codeHash Code hash of the jetton wallet contract (hex string with 0x prefix)
 * @property dataHash Data hash of the jetton wallet contract (hex string with 0x prefix)
 */
@Serializable
data class TONJettonWallet(
    // Jetton master address (comes first in JSON as "address")
    /** Jetton master contract address (user-friendly format: UQ... or EQ...) */
    @SerialName("address")
    val jettonAddress: String? = null,

    // Wallet address (comes second in JSON as "jettonWalletAddress")
    /** Jetton wallet contract address (user-friendly format: UQ... or EQ...) */
    @SerialName("jettonWalletAddress")
    val walletAddress: String,

    // Wallet properties
    val balance: String? = null,
    /** Owner wallet address (user-friendly format) */
    val owner: String? = null,
    @SerialName("last_transaction_lt")
    val lastTransactionLt: String? = null,
    /** Code hash of the jetton wallet contract (hex string with 0x prefix) */
    @SerialName("code_hash")
    val codeHash: String? = null,
    /** Data hash of the jetton wallet contract (hex string with 0x prefix) */
    @SerialName("data_hash")
    val dataHash: String? = null,

    // Jetton metadata properties
    val name: String? = null,
    val symbol: String? = null,
    val description: String? = null,
    val decimals: Int? = null,
    val image: String? = null,
    @SerialName("image_data")
    val imageData: String? = null,
    val uri: String? = null,
    val verification: TONJettonVerification? = null,

    // Additional properties
    @SerialName("usdValue")
    val usdValue: String? = null,
    @SerialName("lastActivity")
    val lastActivity: String? = null,
) {
    /**
     * Wallet address (alias for backward compatibility).
     */
    @Transient
    val address: String = walletAddress

    /**
     * Get jetton info as a separate TONJetton object for backward compatibility.
     */
    @Transient
    val jetton: TONJetton? = if (jettonAddress != null) {
        TONJetton(
            address = jettonAddress,
            name = name,
            symbol = symbol,
            description = description,
            decimals = decimals,
            image = image,
            imageData = imageData,
            uri = uri,
            verification = verification,
        )
    } else {
        null
    }
}
