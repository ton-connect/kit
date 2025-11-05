package io.ton.walletkit.engine

import io.ton.walletkit.internal.constants.BridgeMethodConstants
import io.ton.walletkit.internal.constants.ResponseConstants
import kotlinx.serialization.json.Json
import org.json.JSONArray
import org.json.JSONObject

/**
 * Groups TON transaction related bridge operations including creation, preview,
 * submission, and acknowledgement of newly created transactions.
 *
 * @property ensureInitialized Suspended callback that ensures the bridge is ready.
 * @property rpcClient Client used to invoke bridge methods.
 * @property json Kotlin serialization instance used for decoding bridge payloads.
 *
 * @suppress Internal component used by [WebViewWalletKitEngine].
 */
internal class TransactionOperations(
    private val ensureInitialized: suspend () -> Unit,
    private val rpcClient: BridgeRpcClient,
    private val json: Json,
) {

    suspend fun createTransferTonTransaction(
        walletAddress: String,
        params: io.ton.walletkit.model.TONTransferParams,
    ): String {
        ensureInitialized()

        val paramsJson =
            JSONObject().apply {
                put(ResponseConstants.KEY_WALLET_ADDRESS, walletAddress)
                put(ResponseConstants.KEY_TO_ADDRESS, params.toAddress)
                put(ResponseConstants.KEY_AMOUNT, params.amount)
                if (!params.comment.isNullOrBlank()) {
                    put(ResponseConstants.KEY_COMMENT, params.comment)
                }
                if (!params.body.isNullOrBlank()) {
                    put(ResponseConstants.KEY_BODY, params.body)
                }
                if (!params.stateInit.isNullOrBlank()) {
                    put(ResponseConstants.KEY_STATE_INIT, params.stateInit)
                }
            }

        val result = rpcClient.call(BridgeMethodConstants.METHOD_CREATE_TRANSFER_TON_TRANSACTION, paramsJson)
        return result.toString()
    }

    suspend fun createTransferMultiTonTransaction(
        walletAddress: String,
        messages: List<io.ton.walletkit.model.TONTransferParams>,
    ): String {
        ensureInitialized()

        val messagesArray = JSONArray()
        messages.forEach { message ->
            val msgJson =
                JSONObject().apply {
                    put("toAddress", message.toAddress)
                    put("amount", message.amount)
                    message.comment?.let { put("comment", it) }
                    message.body?.let { put("body", it) }
                    message.stateInit?.let { put("stateInit", it) }
                }
            messagesArray.put(msgJson)
        }

        val paramsJson =
            JSONObject().apply {
                put("address", walletAddress)
                put("messages", messagesArray)
            }

        val result = rpcClient.call(BridgeMethodConstants.METHOD_CREATE_TRANSFER_MULTI_TON_TRANSACTION, paramsJson)
        return result.toString()
    }

    suspend fun handleNewTransaction(walletAddress: String, transactionContent: String) {
        ensureInitialized()

        val params =
            JSONObject().apply {
                put(ResponseConstants.KEY_WALLET_ADDRESS, walletAddress)
                put(ResponseConstants.KEY_TRANSACTION_CONTENT, transactionContent)
            }

        rpcClient.call(BridgeMethodConstants.METHOD_HANDLE_NEW_TRANSACTION, params)
    }

    suspend fun sendTransaction(walletAddress: String, transactionContent: String): String {
        ensureInitialized()

        val params =
            JSONObject().apply {
                put(ResponseConstants.KEY_WALLET_ADDRESS, walletAddress)
                put(ResponseConstants.KEY_TRANSACTION_CONTENT, transactionContent)
            }

        val result = rpcClient.call(BridgeMethodConstants.METHOD_SEND_TRANSACTION, params)
        return result.getString(ResponseConstants.KEY_SIGNED_BOC)
    }

    suspend fun getTransactionPreview(walletAddress: String, transactionContent: String): io.ton.walletkit.model.TONTransactionPreview {
        ensureInitialized()

        val paramsJson =
            JSONObject().apply {
                put("address", walletAddress)
                put("transactionContent", JSONObject(transactionContent))
            }

        val result = rpcClient.call(BridgeMethodConstants.METHOD_GET_TRANSACTION_PREVIEW, paramsJson)
        return json.decodeFromString(io.ton.walletkit.model.TONTransactionPreview.serializer(), result.toString())
    }
}
