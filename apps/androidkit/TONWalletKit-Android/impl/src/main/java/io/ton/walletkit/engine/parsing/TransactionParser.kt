package io.ton.walletkit.engine.parsing

import android.util.Log
import io.ton.walletkit.internal.constants.JsonConstants
import io.ton.walletkit.internal.constants.LogConstants
import io.ton.walletkit.internal.constants.MiscConstants
import io.ton.walletkit.internal.constants.ResponseConstants
import io.ton.walletkit.model.Transaction
import io.ton.walletkit.model.TransactionType
import org.json.JSONArray

/**
 * Converts raw transaction JSON arrays received from the bridge into strongly typed
 * [Transaction] instances that the SDK exposes to clients.
 *
 * This implementation mirrors the legacy inline parser and therefore preserves the same filtering
 * logic, heuristics, and logging output.
 *
 * @suppress Internal component. Use through [WebViewWalletKitEngine].
 */
internal class TransactionParser {
    fun parseTransactions(jsonArray: JSONArray?): List<Transaction> {
        if (jsonArray == null) return emptyList()

        return buildList(jsonArray.length()) {
            for (i in 0 until jsonArray.length()) {
                val txJson = jsonArray.optJSONObject(i) ?: continue

                // Get messages
                val inMsg = txJson.optJSONObject(ResponseConstants.KEY_IN_MSG)
                val outMsgs = txJson.optJSONArray(ResponseConstants.KEY_OUT_MSGS)

                // Filter out jetton/token transactions
                // Jetton transactions have op_code in their messages (like 0xf8a7ea5 for transfer)
                // or have a message body/payload
                val isJettonOrTokenTx =
                    when {
                        // Check incoming message for jetton markers
                        inMsg != null -> {
                            val opCode = inMsg.optString(ResponseConstants.KEY_OP_CODE)?.takeIf { it.isNotEmpty() }
                            val body = inMsg.optString(ResponseConstants.KEY_BODY)?.takeIf { it.isNotEmpty() }
                            val message = inMsg.optString(ResponseConstants.KEY_MESSAGE)?.takeIf { it.isNotEmpty() }
                            // Has op_code or has complex body (not just a comment)
                            opCode != null || (body != null && body != ResponseConstants.VALUE_EMPTY_CELL_BODY) ||
                                (message != null && message.length > 200)
                        }
                        // Check outgoing messages for jetton markers
                        outMsgs != null && outMsgs.length() > 0 -> {
                            var hasJettonMarkers = false
                            for (j in 0 until outMsgs.length()) {
                                val msg = outMsgs.optJSONObject(j) ?: continue
                                val opCode = msg.optString(ResponseConstants.KEY_OP_CODE)?.takeIf { it.isNotEmpty() }
                                val body = msg.optString(ResponseConstants.KEY_BODY)?.takeIf { it.isNotEmpty() }
                                val message = msg.optString(ResponseConstants.KEY_MESSAGE)?.takeIf { it.isNotEmpty() }
                                if (opCode != null || (body != null && body != ResponseConstants.VALUE_EMPTY_CELL_BODY) ||
                                    (message != null && message.length > 200)
                                ) {
                                    hasJettonMarkers = true
                                    break
                                }
                            }
                            hasJettonMarkers
                        }
                        else -> false
                    }

                // Skip non-TON transactions
                if (isJettonOrTokenTx) {
                    Log.d(TAG, "Skipping jetton/token transaction: ${txJson.optString(ResponseConstants.KEY_HASH_HEX, ResponseConstants.VALUE_UNKNOWN)}")
                    continue
                }

                // Determine transaction type based on incoming/outgoing value
                // Check if incoming message has value (meaning we received funds)
                val incomingValue = inMsg?.optString(ResponseConstants.KEY_VALUE)?.toLongOrNull() ?: 0L
                val hasIncomingValue = incomingValue > 0

                // Check if we have outgoing messages with value
                var outgoingValue = 0L
                if (outMsgs != null) {
                    for (j in 0 until outMsgs.length()) {
                        val msg = outMsgs.optJSONObject(j)
                        val value = msg?.optString(ResponseConstants.KEY_VALUE)?.toLongOrNull() ?: 0L
                        outgoingValue += value
                    }
                }
                val hasOutgoingValue = outgoingValue > 0

                // Transaction is INCOMING if we received value, OUTGOING if we only sent value
                // Note: Many incoming transactions also have outgoing messages (fees, change, etc.)
                val type =
                    when {
                        hasIncomingValue -> TransactionType.INCOMING
                        hasOutgoingValue -> TransactionType.OUTGOING
                        else -> TransactionType.UNKNOWN
                    }

                // Get amount based on transaction type (already calculated above)
                val amount =
                    when (type) {
                        TransactionType.INCOMING -> incomingValue.toString()
                        TransactionType.OUTGOING -> outgoingValue.toString()
                        else -> ResponseConstants.VALUE_ZERO
                    }

                // Get fee from total_fees field
                val fee = txJson.optString(ResponseConstants.KEY_TOTAL_FEES)?.takeIf { it.isNotEmpty() }

                // Get comment from messages
                val comment =
                    when (type) {
                        TransactionType.INCOMING -> inMsg?.optString(ResponseConstants.KEY_COMMENT)?.takeIf { it.isNotEmpty() }
                        TransactionType.OUTGOING -> outMsgs?.optJSONObject(0)?.optString(ResponseConstants.KEY_COMMENT)?.takeIf { it.isNotEmpty() }
                        else -> null
                    }

                // Get sender - prefer friendly address
                val sender =
                    if (type == TransactionType.INCOMING) {
                        inMsg?.optString(ResponseConstants.KEY_SOURCE_FRIENDLY)?.takeIf { it.isNotEmpty() }
                            ?: inMsg?.optString(ResponseConstants.KEY_SOURCE)
                    } else {
                        null
                    }

                // Get recipient - prefer friendly address
                val recipient =
                    if (type == TransactionType.OUTGOING) {
                        outMsgs?.optJSONObject(0)?.let { msg ->
                            msg.optString(ResponseConstants.KEY_DESTINATION_FRIENDLY)?.takeIf { it.isNotEmpty() }
                                ?: msg.optString(ResponseConstants.KEY_DESTINATION)
                        }
                    } else {
                        null
                    }

                // Get hash - prefer hex format
                val hash = txJson.optString(ResponseConstants.KEY_HASH_HEX)?.takeIf { it.isNotEmpty() }
                    ?: txJson.optString(JsonConstants.KEY_HASH, MiscConstants.EMPTY_STRING)

                // Get timestamp - use 'now' field and convert to milliseconds
                val timestamp = txJson.optLong(ResponseConstants.KEY_NOW, 0L) * 1000

                // Get logical time and block sequence number
                val lt = txJson.optString(JsonConstants.KEY_LT)?.takeIf { it.isNotEmpty() }
                val blockSeqno = txJson.optInt(ResponseConstants.KEY_MC_BLOCK_SEQNO, -1).takeIf { it >= 0 }

                add(
                    Transaction(
                        hash = hash,
                        timestamp = timestamp,
                        amount = amount,
                        fee = fee,
                        comment = comment,
                        sender = sender,
                        recipient = recipient,
                        type = type,
                        lt = lt,
                        blockSeqno = blockSeqno,
                    ),
                )
            }
        }
    }

    private companion object {
        private const val TAG = LogConstants.TAG_WEBVIEW_ENGINE
    }
}
