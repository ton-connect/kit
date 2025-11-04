package io.ton.walletkit.request

import io.ton.walletkit.event.ConnectRequestEvent
import io.ton.walletkit.event.SignDataRequestEvent
import io.ton.walletkit.event.TransactionRequestEvent

/**
 * Internal interface for handling request approvals/rejections.
 * Implementation provided by the bridge module.
 * @suppress
 */
interface RequestHandler {
    suspend fun approveConnect(event: ConnectRequestEvent)
    suspend fun rejectConnect(event: ConnectRequestEvent, reason: String?)

    suspend fun approveTransaction(event: TransactionRequestEvent)
    suspend fun rejectTransaction(event: TransactionRequestEvent, reason: String?)

    suspend fun approveSignData(event: SignDataRequestEvent)
    suspend fun rejectSignData(event: SignDataRequestEvent, reason: String?)
}
