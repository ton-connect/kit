package io.ton.walletkit.presentation.request

import io.ton.walletkit.domain.model.DAppInfo
import io.ton.walletkit.presentation.WalletKitEngine
import io.ton.walletkit.presentation.event.ConnectRequestEvent

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
class TONWalletConnectionRequest internal constructor(
    val dAppInfo: DAppInfo?,
    val permissions: List<ConnectRequestEvent.ConnectPermission>,
    private val event: ConnectRequestEvent,
    private val engine: WalletKitEngine,
) {
    /**
     * Approve this connection request with the specified wallet.
     *
     * @param walletAddress Address of the wallet to connect with
     * @throws io.ton.walletkit.presentation.WalletKitBridgeException if approval fails
     */
    suspend fun approve(walletAddress: String) {
        val eventWithWallet = event.copy(walletAddress = walletAddress)
        engine.approveConnect(eventWithWallet)
    }

    /**
     * Reject this connection request.
     *
     * @param reason Optional reason for rejection
     * @throws io.ton.walletkit.presentation.WalletKitBridgeException if rejection fails
     */
    suspend fun reject(reason: String? = null) {
        engine.rejectConnect(event, reason)
    }
}
