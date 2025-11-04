package io.ton.walletkit

/**
 * Exception thrown when an error occurs during WalletKit bridge operations.
 *
 * This exception is thrown when the JavaScript bridge encounters issues such as:
 * - Bridge initialization failures
 * - Invalid responses from the JavaScript layer
 * - Communication errors between Kotlin and JavaScript
 * - JavaScript runtime exceptions that propagate to the native layer
 * - Timeout errors when waiting for bridge responses
 *
 * Example scenarios:
 * ```
 * // Bridge not initialized
 * throw WalletKitBridgeException("Bridge not initialized")
 *
 * // Invalid JSON response
 * throw WalletKitBridgeException("Failed to parse bridge response: $jsonString")
 *
 * // JavaScript error
 * throw WalletKitBridgeException("JavaScript error: ${error.message}")
 * ```
 *
 * @property message A descriptive error message explaining what went wrong
 * @see io.ton.walletkit.presentation.WalletKitEngine
 */
class WalletKitBridgeException(message: String) : Exception(message)
