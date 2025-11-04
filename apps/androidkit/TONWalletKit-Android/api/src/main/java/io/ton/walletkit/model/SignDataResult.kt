package io.ton.walletkit.model

/**
 * Result of a sign data operation.
 *
 * @property signature Base64-encoded signature
 */
data class SignDataResult(
    val signature: String,
)
