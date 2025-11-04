package io.ton.walletkit.model

import kotlinx.serialization.Serializable

/**
 * Error from transaction emulation.
 *
 * Mirrors the shared TON Wallet Kit error contract for cross-platform consistency.
 *
 * @property name Error name/type
 * @property message Error message
 * @property cause Error cause/reason
 */
@Serializable
data class TONEmulationError(
    val name: String,
    val message: String? = null,
    val cause: String? = null,
)
