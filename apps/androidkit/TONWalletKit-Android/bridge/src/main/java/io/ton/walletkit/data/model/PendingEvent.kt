package io.ton.walletkit.data.model

import java.io.Serializable

/**
 * Represents a pending event that needs to be delivered to a handler.
 *
 * Events are stored when:
 * - No handler is registered yet
 * - Handler throws an exception during processing
 *
 * Stored events are replayed when a handler is registered.
 *
 * @property id Unique identifier for this event
 * @property type Event type (e.g., "connectRequest", "transactionRequest")
 * @property data JSON data for the event
 * @property timestamp ISO-8601 timestamp when event was received
 * @property retryCount Number of times delivery has been attempted
 */
data class PendingEvent(
    val id: String,
    val type: String,
    val data: String,
    val timestamp: String,
    val retryCount: Int = 0,
) : Serializable
