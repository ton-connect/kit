package io.ton.walletkit.internal.constants

/**
 * Constants for bridge event type strings.
 *
 * These constants define the event types that can be received from the JavaScript
 * bridge layer. They are used for event routing and handling in the presentation layer.
 *
 * @suppress Internal implementation constants. Not part of public API.
 */
internal object EventTypeConstants {
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
     * Event type for browser page started loading.
     */
    const val EVENT_BROWSER_PAGE_STARTED = "browserPageStarted"

    /**
     * Event type for browser page finished loading.
     */
    const val EVENT_BROWSER_PAGE_FINISHED = "browserPageFinished"

    /**
     * Event type for browser errors.
     */
    const val EVENT_BROWSER_ERROR = "browserError"

    /**
     * Event type for browser bridge requests.
     */
    const val EVENT_BROWSER_BRIDGE_REQUEST = "browserBridgeRequest"

    /**
     * Event type for external signer wallet sign requests.
     */
    const val EVENT_SIGNER_SIGN_REQUEST = "signerSignRequest"

    /**
     * Default value for unknown event types.
     */
    const val EVENT_TYPE_UNKNOWN = "unknown"
}
