package io.ton.walletkit.presentation.event

import io.ton.walletkit.presentation.request.TONWalletConnectionRequest
import io.ton.walletkit.presentation.request.TONWalletSignDataRequest
import io.ton.walletkit.presentation.request.TONWalletTransactionRequest

/**
 * Events from TON Wallet Kit using a type-safe sealed hierarchy.
 *
 * Mirrors the canonical TON Wallet Kit event model for cross-platform consistency.
 *
 * Use this with exhaustive when() expressions to handle all possible events.
 */
sealed class TONWalletKitEvent {
    /**
     * A dApp is requesting to connect to a wallet.
     *
     * Handle by calling [TONWalletConnectionRequest.approve] with a wallet address
     * or [TONWalletConnectionRequest.reject] to deny.
     *
     * @property request Connection request with approve/reject methods
     */
    data class ConnectRequest(
        val request: TONWalletConnectionRequest,
    ) : TONWalletKitEvent()

    /**
     * A dApp is requesting to execute a transaction.
     *
     * Handle by calling [TONWalletTransactionRequest.approve] to execute
     * or [TONWalletTransactionRequest.reject] to deny.
     *
     * @property request Transaction request with approve/reject methods
     */
    data class TransactionRequest(
        val request: TONWalletTransactionRequest,
    ) : TONWalletKitEvent()

    /**
     * A dApp is requesting to sign arbitrary data.
     *
     * Handle by calling [TONWalletSignDataRequest.approve] to sign
     * or [TONWalletSignDataRequest.reject] to deny.
     *
     * @property request Sign data request with approve/reject methods
     */
    data class SignDataRequest(
        val request: TONWalletSignDataRequest,
    ) : TONWalletKitEvent()

    /**
     * A session has been disconnected.
     *
     * This is informational - no action required.
     *
     * @property event Disconnect event details
     */
    data class Disconnect(
        val event: DisconnectEvent,
    ) : TONWalletKitEvent()

    /**
     * Browser page started loading.
     *
     * This event is emitted when using WebView extensions (e.g., `webView.injectTonConnect()`).
     * Use it to update UI loading state.
     *
     * @property url The URL that started loading
     */
    data class BrowserPageStarted(
        val url: String,
    ) : TONWalletKitEvent()

    /**
     * Browser page finished loading.
     *
     * This event is emitted when using WebView extensions (e.g., `webView.injectTonConnect()`).
     * Use it to update UI loading state.
     *
     * @property url The URL that finished loading
     */
    data class BrowserPageFinished(
        val url: String,
    ) : TONWalletKitEvent()

    /**
     * Browser encountered an error.
     *
     * This event is emitted when using WebView extensions (e.g., `webView.injectTonConnect()`).
     * Use it to display error messages to the user.
     *
     * @property message Error message
     */
    data class BrowserError(
        val message: String,
    ) : TONWalletKitEvent()

    /**
     * Browser received a TonConnect request.
     *
     * This event is emitted when using WebView extensions (e.g., `webView.injectTonConnect()`).
     * The SDK automatically processes the request - this event is for UI tracking only
     * (e.g., showing request count, displaying notifications).
     *
     * @property messageId The unique message ID
     * @property method The TonConnect method (connect, sendTransaction, signData)
     * @property request The full request JSON
     */
    data class BrowserBridgeRequest(
        val messageId: String,
        val method: String,
        val request: String,
    ) : TONWalletKitEvent()
}

/**
 * Disconnect event details.
 *
 * @property sessionId ID of the disconnected session
 * @property from Session ID from the request
 * @property walletAddress Wallet address involved in the disconnection
 * @property domain Domain of the dApp
 * @property isJsBridge Whether this is from JS bridge (internal browser)
 * @property tabId Tab ID for JS bridge events
 * @property isLocal Whether this is a local event
 * @property messageId Message ID for tracking
 * @property traceId Trace ID for debugging
 * @property method Request method
 * @property params Request parameters
 * @property reason Disconnect reason
 * @property dAppInfo DApp information
 */
data class DisconnectEvent(
    val sessionId: String? = null,
    val from: String? = null,
    val walletAddress: String? = null,
    val domain: String? = null,
    val isJsBridge: Boolean? = null,
    val tabId: String? = null,
    val isLocal: Boolean? = null,
    val messageId: String? = null,
    val traceId: String? = null,
    val method: String? = null,
    val params: List<String>? = null,
    val reason: String? = null,
    val dAppInfo: io.ton.walletkit.domain.model.DAppInfo? = null,
)
