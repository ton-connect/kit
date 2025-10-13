package io.ton.walletkit.presentation.request

import io.ton.walletkit.presentation.WalletKitEngine
import io.ton.walletkit.presentation.event.SignDataRequestEvent
import io.ton.walletkit.presentation.model.DAppInfo
import io.ton.walletkit.presentation.model.SignDataResult
import io.ton.walletkit.presentation.model.SignDataRequest as SignDataRequestData

/**
 * Represents a data signing request from a dApp.
 * Encapsulates both request data and approval/rejection actions.
 *
 * @property requestId Unique identifier for this request
 * @property dAppInfo Information about the requesting dApp
 * @property request Sign data request details (payload, etc.)
 * @property event Typed event data from the bridge
 */
class SignDataRequest internal constructor(
    val requestId: String,
    val dAppInfo: DAppInfo?,
    val request: SignDataRequestData,
    val event: SignDataRequestEvent,
    private val engine: WalletKitEngine,
) {
    /**
     * Approve and sign this data signing request.
     *
     * @return Signature result containing the base64-encoded signature
     * @throws io.ton.walletkit.bridge.WalletKitBridgeException if approval or signing fails
     */
    suspend fun approve(): SignDataResult = engine.approveSignData(event)

    /**
     * Reject this data signing request.
     *
     * @param reason Optional reason for rejection
     * @throws io.ton.walletkit.bridge.WalletKitBridgeException if rejection fails
     */
    suspend fun reject(reason: String? = null) {
        engine.rejectSignData(event, reason)
    }
}
