package io.ton.walletkit.presentation.request

import io.ton.walletkit.domain.constants.MiscConstants
import io.ton.walletkit.domain.constants.ResponseConstants
import io.ton.walletkit.domain.model.DAppInfo
import io.ton.walletkit.presentation.WalletKitEngine
import io.ton.walletkit.presentation.event.TransactionRequestEvent

/**
 * Represents a transaction request from a dApp.
 *
 * Aligns with the shared TON Wallet Kit API contract for cross-platform consistency.
 *
 * Handle this request by calling [approve] to execute the transaction
 * or [reject] to deny it.
 *
 * @property dAppInfo Information about the requesting dApp
 * @property messages List of messages in this transaction
 * @property validUntil Unix timestamp when this transaction expires (optional)
 * @property network Network to use for this transaction (optional)
 */
class TONWalletTransactionRequest internal constructor(
    val dAppInfo: DAppInfo?,
    private val event: TransactionRequestEvent,
    private val engine: WalletKitEngine,
) {
    /**
     * List of messages to be sent in this transaction
     */
    val messages: List<TransactionMessage>
        get() = event.request?.messages?.map { msg ->
            TransactionMessage(
                address = msg.address ?: MiscConstants.EMPTY_STRING,
                amount = msg.amount ?: ResponseConstants.VALUE_ZERO,
                payload = msg.payload,
                stateInit = msg.stateInit,
            )
        } ?: emptyList()

    /**
     * Unix timestamp when this transaction request expires (optional)
     */
    val validUntil: Long?
        get() = event.request?.validUntil

    /**
     * Network identifier for this transaction (optional)
     */
    val network: String?
        get() = event.request?.network

    /**
     * Approve this transaction request.
     *
     * @throws io.ton.walletkit.presentation.WalletKitBridgeException if approval fails
     */
    suspend fun approve() {
        engine.approveTransaction(event)
    }

    /**
     * Reject this transaction request.
     *
     * @param reason Optional reason for rejection
     * @throws io.ton.walletkit.presentation.WalletKitBridgeException if rejection fails
     */
    suspend fun reject(reason: String? = null) {
        engine.rejectTransaction(event, reason)
    }
}

/**
 * Represents a single message in a transaction request.
 *
 * @property address Destination address for this message
 * @property amount Amount in nanotons (as string to preserve precision)
 * @property payload Optional message payload (base64 encoded BOC)
 * @property stateInit Optional state init (base64 encoded BOC)
 */
data class TransactionMessage(
    val address: String,
    val amount: String,
    val payload: String? = null,
    val stateInit: String? = null,
)
