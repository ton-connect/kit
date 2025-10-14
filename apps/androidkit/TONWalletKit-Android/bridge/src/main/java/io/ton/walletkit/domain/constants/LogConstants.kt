package io.ton.walletkit.domain.constants

/**
 * Constants for logging tags used throughout the SDK.
 *
 * These constants provide consistent logging tags for different components,
 * making it easier to filter and search logs during development and debugging.
 */
object LogConstants {
    /**
     * Log tag for SecureWalletKitStorage class.
     */
    const val TAG_SECURE_STORAGE = "SecureWalletKitStorage"

    /**
     * Log tag for SecureBridgeStorageAdapter class.
     */
    const val TAG_BRIDGE_STORAGE = "SecureBridgeStorageAdapter"

    /**
     * Log tag for WebViewWalletKitEngine class.
     */
    const val TAG_WEBVIEW_ENGINE = "WebViewWalletKitEngine"

    // Log messages
    /**
     * Log message for bridge ready state.
     */
    const val MSG_BRIDGE_READY = "bridge ready"

    /**
     * Log message prefix for malformed payload from JavaScript.
     */
    const val MSG_MALFORMED_PAYLOAD = "Malformed payload from JS"

    /**
     * Error message prefix for malformed payloads.
     */
    const val ERROR_MALFORMED_PAYLOAD_PREFIX = "Malformed payload: "

    /**
     * Log message prefix for storage get failures.
     */
    const val MSG_STORAGE_GET_FAILED = "Storage get failed for key: "

    /**
     * Log message prefix for storage set failures.
     */
    const val MSG_STORAGE_SET_FAILED = "Storage set failed for key: "

    /**
     * Log message prefix for storage remove failures.
     */
    const val MSG_STORAGE_REMOVE_FAILED = "Storage remove failed for key: "

    /**
     * Log message for storage clear failures.
     */
    const val MSG_STORAGE_CLEAR_FAILED = "Storage clear failed"
}
