package io.ton.walletkit.domain.constants

/**
 * Constants for bridge event type strings.
 *
 * These constants define the event types that can be received from the JavaScript
 * bridge layer. They are used for event routing and handling in the presentation layer.
 */
object EventTypeConstants {
    /**
     * Event type for TON Connect connection requests.
     */
    const val EVENT_CONNECT_REQUEST = "connectRequest"

    /**
     * Event type for transaction approval requests.
     */
    const val EVENT_TRANSACTION_REQUEST = "transactionRequest"

    /**
     * Event type for sign data requests (text, binary, cell).
     */
    const val EVENT_SIGN_DATA_REQUEST = "signDataRequest"

    /**
     * Event type for session disconnection.
     */
    const val EVENT_DISCONNECT = "disconnect"

    /**
     * Event type for wallet state changes.
     */
    const val EVENT_STATE_CHANGED = "stateChanged"

    /**
     * Alternative event type for wallet state changes.
     */
    const val EVENT_WALLET_STATE_CHANGED = "walletStateChanged"

    /**
     * Event type for sessions list changes.
     */
    const val EVENT_SESSIONS_CHANGED = "sessionsChanged"

    /**
     * Default value for unknown event types.
     */
    const val EVENT_TYPE_UNKNOWN = "unknown"
}
