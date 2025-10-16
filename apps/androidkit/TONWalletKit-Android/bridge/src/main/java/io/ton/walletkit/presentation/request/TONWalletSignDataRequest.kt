package io.ton.walletkit.presentation.request

import io.ton.walletkit.domain.model.DAppInfo
import io.ton.walletkit.presentation.WalletKitEngine
import io.ton.walletkit.presentation.event.SignDataRequestEvent
import io.ton.walletkit.presentation.event.SignDataType

/**
 * Represents a data signing request from a dApp.
 *
 * Aligns with the shared TON Wallet Kit API contract for cross-platform consistency.
 *
 * Handle this request by calling [approve] to sign the data
 * or [reject] to deny it.
 *
 * @property dAppInfo Information about the requesting dApp
 * @property walletAddress Address of the wallet to use for signing
 * @property payloadType Type of data to sign (TEXT, BINARY, or CELL)
 * @property payloadContent The actual content to sign (text, base64 bytes, or cell BOC)
 * @property preview Human-readable preview of the data if available
 */
class TONWalletSignDataRequest internal constructor(
    val dAppInfo: DAppInfo?,
    val walletAddress: String?,
    private val event: SignDataRequestEvent,
    private val engine: WalletKitEngine,
) {
    /**
     * Type of data to sign
     */
    val payloadType: SignDataType
        get() = event.request?.type ?: SignDataType.BINARY

    /**
     * The content to be signed (text, base64 bytes, or cell BOC depending on type)
     */
    val payloadContent: String
        get() = when (event.request?.type) {
            SignDataType.TEXT -> event.request.text ?: ""
            SignDataType.BINARY -> event.request.bytes ?: ""
            SignDataType.CELL -> event.request.cell ?: ""
            null -> ""
        }

    /**
     * Human-readable preview of the data if available
     */
    val preview: String?
        get() = event.preview?.content

    /**
     * Approve and sign this data signing request.
     *
     * Note: This method does not return the signature. The signature is sent to the dApp
     * automatically through the bridge.
     *
     * @throws io.ton.walletkit.presentation.WalletKitBridgeException if approval or signing fails
     */
    suspend fun approve() {
        engine.approveSignData(event)
    }

    /**
     * Reject this data signing request.
     *
     * @param reason Optional reason for rejection
     * @throws io.ton.walletkit.presentation.WalletKitBridgeException if rejection fails
     */
    suspend fun reject(reason: String? = null) {
        engine.rejectSignData(event, reason)
    }
}
