package io.ton.walletkit.browser

/**
 * Tracks a pending request from a specific frame.
 * Stores the frameId so we can send responses back to the correct window/iframe.
 */
internal data class PendingRequest(
    val frameId: String,
    val messageId: String,
    val method: String,
    val timestamp: Long,
)
