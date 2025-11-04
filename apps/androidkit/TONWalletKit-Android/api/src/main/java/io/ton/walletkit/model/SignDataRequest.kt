package io.ton.walletkit.model

/**
 * Represents a request from a dApp to sign arbitrary data.
 *
 * This is used for scenarios where a dApp needs cryptographic proof
 * of wallet ownership or wants to sign a message without creating
 * a blockchain transaction.
 *
 * @property payload The data to be signed, typically encoded as base64 or hex
 * @property schema Optional identifier for the data schema/format (e.g., "ton-proof-item-v2")
 */
data class SignDataRequest(
    val payload: String,
    val schema: String? = null,
)
