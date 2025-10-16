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
}

/**
 * Disconnect event details.
 *
 * @property sessionId ID of the disconnected session
 */
data class DisconnectEvent(
    val sessionId: String,
)
