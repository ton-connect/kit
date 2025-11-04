package io.ton.walletkit.request

import io.ton.walletkit.event.ConnectRequestEvent
import io.ton.walletkit.model.DAppInfo

/**
 * Represents a connection request from a dApp.
 *
 * Aligns with the shared TON Wallet Kit API contract for cross-platform consistency.
 *
 * Handle this request by calling [approve] with a wallet address
 * or [reject] to deny the connection.
 *
 * @property dAppInfo Information about the requesting dApp
 * @property permissions List of requested permissions
 */
class TONWalletConnectionRequest(
    val dAppInfo: DAppInfo?,
    val permissions: List<ConnectRequestEvent.ConnectPermission>,
    private val event: ConnectRequestEvent,
    private val handler: RequestHandler,
) {
    /**
     * Approve this connection request with the specified wallet.
     *
     * @param walletAddress Address of the wallet to connect with
     * @throws io.ton.walletkit.WalletKitBridgeException if approval fails
     */
    suspend fun approve(walletAddress: String) {
        val eventWithWallet = event.copy(walletAddress = walletAddress)
        handler.approveConnect(eventWithWallet)
    }

    /**
     * Reject this connection request.
     *
     * @param reason Optional reason for rejection
     * @throws io.ton.walletkit.WalletKitBridgeException if rejection fails
     */
    suspend fun reject(reason: String? = null) {
        handler.rejectConnect(event, reason)
    }
}
