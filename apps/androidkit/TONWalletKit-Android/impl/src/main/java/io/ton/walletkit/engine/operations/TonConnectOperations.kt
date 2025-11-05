package io.ton.walletkit.engine.operations

import android.util.Log
import io.ton.walletkit.WalletKitBridgeException
import io.ton.walletkit.engine.infrastructure.BridgeRpcClient
import io.ton.walletkit.event.ConnectRequestEvent
import io.ton.walletkit.event.SignDataRequestEvent
import io.ton.walletkit.event.TransactionRequestEvent
import io.ton.walletkit.internal.constants.BridgeMethodConstants
import io.ton.walletkit.internal.constants.JsonConstants
import io.ton.walletkit.internal.constants.LogConstants
import io.ton.walletkit.internal.constants.ResponseConstants
import io.ton.walletkit.model.WalletSession
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.json.JSONArray
import org.json.JSONObject

/**
 * Wraps TON Connect bridge calls such as processing URLs, responding to connect/sign
 * requests, and session lifecycle management.
 *
 * @property ensureInitialized Suspended callback that ensures the bridge is ready.
 * @property rpcClient Bridge RPC client.
 * @property json Serializer used for transforming Kotlin data classes to JSON payloads.
 *
 * @suppress Internal component used by [WebViewWalletKitEngine].
 */
internal class TonConnectOperations(
    private val ensureInitialized: suspend () -> Unit,
    private val rpcClient: BridgeRpcClient,
    private val json: Json,
) {

    suspend fun handleTonConnectUrl(url: String) {
        ensureInitialized()

        val params = JSONObject().apply { put(ResponseConstants.KEY_URL, url) }
        rpcClient.call(BridgeMethodConstants.METHOD_HANDLE_TON_CONNECT_URL, params)
    }

    suspend fun handleTonConnectRequest(
        messageId: String,
        method: String,
        paramsJson: String?,
        url: String?,
        responseCallback: (JSONObject) -> Unit,
    ) {
        try {
            ensureInitialized()

            Log.d(TAG, "Processing internal browser request: $method (messageId: $messageId)")
            Log.d(TAG, "dApp URL: $url")

            val params: Any? =
                when {
                    paramsJson == null -> null
                    paramsJson.trimStart().startsWith("[") -> JSONArray(paramsJson)
                    paramsJson.trimStart().startsWith("{") -> JSONObject(paramsJson)
                    else -> {
                        Log.w(TAG, "Unexpected params format: $paramsJson")
                        null
                    }
                }

            val requestParams =
                JSONObject().apply {
                    put(ResponseConstants.KEY_MESSAGE_ID, messageId)
                    put(ResponseConstants.KEY_METHOD, method)
                    if (params != null) {
                        put(ResponseConstants.KEY_PARAMS, params)
                    }
                    if (url != null) {
                        put(ResponseConstants.KEY_URL, url)
                    }
                }

            Log.d(TAG, "🔵 Calling processInternalBrowserRequest via bridge...")
            val result = rpcClient.call(BridgeMethodConstants.METHOD_PROCESS_INTERNAL_BROWSER_REQUEST, requestParams)

            Log.d(TAG, "🟢 Bridge call returned, result: $result")
            Log.d(TAG, "🟢 Calling responseCallback with result...")

            responseCallback(result)

            Log.d(TAG, "✅ Internal browser request processed: $method, responseCallback invoked")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to process internal browser request", e)
            val errorResponse =
                JSONObject().apply {
                    put(
                        ResponseConstants.KEY_ERROR,
                        JSONObject().apply {
                            put(ResponseConstants.KEY_MESSAGE, e.message ?: ERROR_FAILED_PROCESS_REQUEST)
                            put(ResponseConstants.KEY_CODE, 500)
                        },
                    )
                }
            responseCallback(errorResponse)
        }
    }

    suspend fun approveConnect(event: ConnectRequestEvent) {
        ensureInitialized()

        val eventJson = JSONObject(json.encodeToString(event))
        val params =
            JSONObject().apply {
                put(ResponseConstants.KEY_EVENT, eventJson)
                put(
                    ResponseConstants.KEY_WALLET_ADDRESS,
                    event.walletAddress ?: throw WalletKitBridgeException(ERROR_WALLET_ADDRESS_REQUIRED),
                )
            }

        rpcClient.call(BridgeMethodConstants.METHOD_APPROVE_CONNECT_REQUEST, params)
    }

    suspend fun rejectConnect(event: ConnectRequestEvent, reason: String?) {
        ensureInitialized()

        val eventJson = JSONObject(json.encodeToString(event))
        val params =
            JSONObject().apply {
                put(ResponseConstants.KEY_EVENT, eventJson)
                reason?.let { put(ResponseConstants.KEY_REASON, it) }
            }

        rpcClient.call(BridgeMethodConstants.METHOD_REJECT_CONNECT_REQUEST, params)
    }

    suspend fun approveTransaction(event: TransactionRequestEvent) {
        ensureInitialized()

        val eventJson = JSONObject(json.encodeToString(event))
        val params = JSONObject().apply { put(ResponseConstants.KEY_EVENT, eventJson) }
        rpcClient.call(BridgeMethodConstants.METHOD_APPROVE_TRANSACTION_REQUEST, params)
    }

    suspend fun rejectTransaction(event: TransactionRequestEvent, reason: String?) {
        ensureInitialized()

        val eventJson = JSONObject(json.encodeToString(event))
        val params =
            JSONObject().apply {
                put(ResponseConstants.KEY_EVENT, eventJson)
                reason?.let { put(ResponseConstants.KEY_REASON, it) }
            }

        rpcClient.call(BridgeMethodConstants.METHOD_REJECT_TRANSACTION_REQUEST, params)
    }

    suspend fun approveSignData(event: SignDataRequestEvent) {
        ensureInitialized()

        val eventJson = JSONObject(json.encodeToString(event))
        val params = JSONObject().apply { put(ResponseConstants.KEY_EVENT, eventJson) }
        rpcClient.call(BridgeMethodConstants.METHOD_APPROVE_SIGN_DATA_REQUEST, params)
    }

    suspend fun rejectSignData(event: SignDataRequestEvent, reason: String?) {
        ensureInitialized()

        val eventJson = JSONObject(json.encodeToString(event))
        val params =
            JSONObject().apply {
                put(ResponseConstants.KEY_EVENT, eventJson)
                reason?.let { put(ResponseConstants.KEY_REASON, it) }
            }

        rpcClient.call(BridgeMethodConstants.METHOD_REJECT_SIGN_DATA_REQUEST, params)
    }

    suspend fun listSessions(): List<WalletSession> {
        ensureInitialized()

        val result = rpcClient.call(BridgeMethodConstants.METHOD_LIST_SESSIONS)
        Log.d(TAG, "listSessions raw result: $result")
        val items = result.optJSONArray(ResponseConstants.KEY_ITEMS) ?: JSONArray()

        return buildList(items.length()) {
            for (index in 0 until items.length()) {
                val entry = items.optJSONObject(index) ?: continue
                Log.d(
                    TAG,
                    "listSessions entry[$index]: keys=${entry.keys().asSequence().toList()}, sessionId=${entry.optString(ResponseConstants.KEY_SESSION_ID)}",
                )
                add(
                    WalletSession(
                        sessionId = entry.optString(ResponseConstants.KEY_SESSION_ID),
                        dAppName = entry.optString(ResponseConstants.KEY_DAPP_NAME),
                        walletAddress = entry.optString(ResponseConstants.KEY_WALLET_ADDRESS),
                        dAppUrl = entry.optNullableString(JsonConstants.KEY_DAPP_URL),
                        manifestUrl = entry.optNullableString(JsonConstants.KEY_MANIFEST_URL),
                        iconUrl = entry.optNullableString(JsonConstants.KEY_ICON_URL),
                        createdAtIso = entry.optNullableString(ResponseConstants.KEY_CREATED_AT),
                        lastActivityIso = entry.optNullableString(ResponseConstants.KEY_LAST_ACTIVITY),
                    ),
                )
            }
        }
    }

    suspend fun disconnectSession(sessionId: String?) {
        ensureInitialized()

        val params = JSONObject()
        sessionId?.let { params.put(ResponseConstants.KEY_SESSION_ID, it) }
        rpcClient.call(BridgeMethodConstants.METHOD_DISCONNECT_SESSION, if (params.length() == 0) null else params)
    }

    private fun JSONObject.optNullableString(key: String): String? {
        val value = opt(key)
        return when (value) {
            null, JSONObject.NULL -> null
            else -> value.toString()
        }
    }

    companion object {
        private const val TAG = "${LogConstants.TAG_WEBVIEW_ENGINE}:TonConnectOps"

        internal const val ERROR_FAILED_PROCESS_REQUEST = "Failed to process request"
        internal const val ERROR_WALLET_ADDRESS_REQUIRED = "walletAddress is required for connect approval"
    }
}
