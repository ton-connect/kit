package io.ton.walletkit.engine.parsing

import android.util.Log
import io.ton.walletkit.engine.WalletKitEngine
import io.ton.walletkit.engine.state.SignerManager
import io.ton.walletkit.event.ConnectRequestEvent
import io.ton.walletkit.event.SignDataRequestEvent
import io.ton.walletkit.event.TONWalletKitEvent
import io.ton.walletkit.event.TransactionRequestEvent
import io.ton.walletkit.internal.constants.EventTypeConstants
import io.ton.walletkit.internal.constants.JsonConstants
import io.ton.walletkit.internal.constants.LogConstants
import io.ton.walletkit.internal.constants.ResponseConstants
import io.ton.walletkit.model.DAppInfo
import io.ton.walletkit.model.SignDataRequest
import io.ton.walletkit.model.TransactionRequest
import io.ton.walletkit.model.WalletSigner
import io.ton.walletkit.request.TONWalletConnectionRequest
import io.ton.walletkit.request.TONWalletSignDataRequest
import io.ton.walletkit.request.TONWalletTransactionRequest
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import org.json.JSONObject

/**
 * Parses raw JSON event payloads emitted by the JavaScript bridge into strongly typed SDK events.
 *
 * The parser encapsulates all JSON access patterns and preserves the legacy logging to keep
 * diagnostics identical to the monolithic implementation.
 *
 * @suppress Internal component. Use through [WebViewWalletKitEngine].
 */
internal class EventParser(
    private val json: Json,
    private val engine: WalletKitEngine,
    private val signerManager: SignerManager,
) {
    fun parseEvent(type: String, data: JSONObject, raw: JSONObject): TONWalletKitEvent? =
        when (type) {
            EventTypeConstants.EVENT_CONNECT_REQUEST -> {
                try {
                    val event = json.decodeFromString<ConnectRequestEvent>(data.toString())
                    val dAppInfo = parseDAppInfo(data)
                    val permissions = event.preview?.permissions ?: emptyList()
                    val request =
                        TONWalletConnectionRequest(
                            dAppInfo = dAppInfo,
                            permissions = permissions,
                            event = event,
                            handler = engine,
                        )
                    TONWalletKitEvent.ConnectRequest(request)
                } catch (e: Exception) {
                    Log.e(TAG, ERROR_FAILED_PARSE_CONNECT_REQUEST, e)
                    null
                }
            }

            EventTypeConstants.EVENT_TRANSACTION_REQUEST -> {
                try {
                    val event = json.decodeFromString<TransactionRequestEvent>(data.toString())
                    val dAppInfo = parseDAppInfo(data)

                    val request =
                        TONWalletTransactionRequest(
                            dAppInfo = dAppInfo,
                            event = event,
                            handler = engine,
                        )
                    TONWalletKitEvent.TransactionRequest(request)
                } catch (e: Exception) {
                    Log.e(TAG, ERROR_FAILED_PARSE_TRANSACTION_REQUEST, e)
                    null
                }
            }

            EventTypeConstants.EVENT_SIGN_DATA_REQUEST -> {
                try {
                    val event = json.decodeFromString<SignDataRequestEvent>(data.toString())
                    val dAppInfo = parseDAppInfo(data)
                    val request =
                        TONWalletSignDataRequest(
                            dAppInfo = dAppInfo,
                            walletAddress = event.walletAddress,
                            event = event,
                            handler = engine,
                        )
                    TONWalletKitEvent.SignDataRequest(request)
                } catch (e: Exception) {
                    Log.e(TAG, ERROR_FAILED_PARSE_SIGN_DATA_REQUEST, e)
                    null
                }
            }

            EventTypeConstants.EVENT_DISCONNECT -> {
                val sessionId =
                    data.optNullableString(ResponseConstants.KEY_SESSION_ID)
                        ?: data.optNullableString(JsonConstants.KEY_ID)
                        ?: return null
                Log.d(TAG, "Disconnect event received. sessionId=$sessionId, dataKeys=${data.keys().asSequence().toList()}")
                TONWalletKitEvent.Disconnect(io.ton.walletkit.event.DisconnectEvent(sessionId))
            }

            EventTypeConstants.EVENT_BROWSER_PAGE_STARTED -> {
                val url = data.optString("url", "")
                TONWalletKitEvent.BrowserPageStarted(url)
            }

            EventTypeConstants.EVENT_BROWSER_PAGE_FINISHED -> {
                val url = data.optString("url", "")
                TONWalletKitEvent.BrowserPageFinished(url)
            }

            EventTypeConstants.EVENT_BROWSER_ERROR -> {
                val message = data.optString("message", "Unknown error")
                TONWalletKitEvent.BrowserError(message)
            }

            EventTypeConstants.EVENT_BROWSER_BRIDGE_REQUEST -> {
                val messageId = data.optString("messageId", "")
                val method = data.optString("method", "")
                val request = data.optString("request", "")
                TONWalletKitEvent.BrowserBridgeRequest(messageId, method, request)
            }

            EventTypeConstants.EVENT_SIGNER_SIGN_REQUEST -> {
                handleSignerSignRequest(data)
                null
            }

            EventTypeConstants.EVENT_STATE_CHANGED,
            EventTypeConstants.EVENT_WALLET_STATE_CHANGED,
            EventTypeConstants.EVENT_SESSIONS_CHANGED,
            -> null

            else -> null
        }

    private fun parseDAppInfo(data: JSONObject): DAppInfo? {
        // Try to get dApp name from multiple sources
        val dAppName =
            data.optNullableString(ResponseConstants.KEY_DAPP_NAME)
                ?: data.optJSONObject(ResponseConstants.KEY_MANIFEST)?.optNullableString(JsonConstants.KEY_NAME)
                ?: data.optJSONObject(ResponseConstants.KEY_PREVIEW)?.optJSONObject(ResponseConstants.KEY_MANIFEST)?.optNullableString(JsonConstants.KEY_NAME)

        // Try to get URLs from multiple sources
        val manifest =
            data.optJSONObject(ResponseConstants.KEY_PREVIEW)?.optJSONObject(ResponseConstants.KEY_MANIFEST)
                ?: data.optJSONObject(ResponseConstants.KEY_MANIFEST)

        val dAppUrl =
            data.optNullableString(ResponseConstants.KEY_DAPP_URL_ALT)
                ?: manifest?.optNullableString(ResponseConstants.KEY_URL) ?: ""

        val iconUrl =
            data.optNullableString(ResponseConstants.KEY_DAPP_ICON_URL)
                ?: manifest?.optNullableString(ResponseConstants.KEY_ICON_URL_ALT)

        val manifestUrl =
            data.optNullableString(ResponseConstants.KEY_MANIFEST_URL_ALT)
                ?: manifest?.optNullableString(ResponseConstants.KEY_URL)

        // Only return null if we have absolutely no dApp information
        if (dAppName == null && dAppUrl.isEmpty()) {
            return null
        }

        return DAppInfo(
            name = dAppName ?: dAppUrl.takeIf { it.isNotEmpty() } ?: "Unknown dApp",
            url = dAppUrl,
            iconUrl = iconUrl,
            manifestUrl = manifestUrl,
        )
    }

    private fun parsePermissions(data: JSONObject): List<String> {
        val permissions = data.optJSONArray(ResponseConstants.KEY_PERMISSIONS) ?: return emptyList()
        return List(permissions.length()) { i ->
            permissions.optString(i)
        }
    }

    fun parseTransactionRequest(data: JSONObject): TransactionRequest {
        // Check if data is nested under request field
        val requestData = data.optJSONObject(ResponseConstants.KEY_REQUEST) ?: data

        // Try to parse from messages array first (TON Connect format)
        val messages = requestData.optJSONArray(ResponseConstants.KEY_MESSAGES)
        if (messages != null && messages.length() > 0) {
            val firstMessage = messages.optJSONObject(0)
            if (firstMessage != null) {
                return TransactionRequest(
                    recipient = firstMessage.optNullableString(ResponseConstants.KEY_ADDRESS)
                        ?: firstMessage.optNullableString(ResponseConstants.KEY_TO)
                        ?: "",
                    amount = firstMessage.optNullableString(ResponseConstants.KEY_AMOUNT)
                        ?: firstMessage.optNullableString(ResponseConstants.KEY_VALUE)
                        ?: "0",
                    comment = firstMessage.optNullableString(ResponseConstants.KEY_COMMENT)
                        ?: firstMessage.optNullableString(ResponseConstants.KEY_TEXT),
                    payload = firstMessage.optNullableString(ResponseConstants.KEY_PAYLOAD),
                )
            }
        }

        // Fallback to direct fields (legacy format or direct send)
        return TransactionRequest(
            recipient = requestData.optNullableString(ResponseConstants.KEY_TO)
                ?: requestData.optNullableString(ResponseConstants.KEY_RECIPIENT) ?: "",
            amount = requestData.optNullableString(ResponseConstants.KEY_AMOUNT)
                ?: requestData.optNullableString(ResponseConstants.KEY_VALUE) ?: "0",
            comment = requestData.optNullableString(ResponseConstants.KEY_COMMENT)
                ?: requestData.optNullableString(ResponseConstants.KEY_TEXT),
            payload = requestData.optNullableString(ResponseConstants.KEY_PAYLOAD),
        )
    }

    fun parseSignDataRequest(data: JSONObject): SignDataRequest {
        // Parse params array - params[0] contains stringified JSON with schema_crc and payload
        var payload = data.optNullableString(ResponseConstants.KEY_PAYLOAD)
            ?: data.optNullableString(ResponseConstants.KEY_DATA) ?: ""
        var schema: String? = data.optNullableString(ResponseConstants.KEY_SCHEMA)

        // Check if params array exists (newer format from bridge)
        val paramsArray = data.optJSONArray(ResponseConstants.KEY_PARAMS)
        if (paramsArray != null && paramsArray.length() > 0) {
            val paramsString = paramsArray.optString(0)
            if (paramsString.isNotEmpty()) {
                try {
                    val paramsObj = JSONObject(paramsString)
                    payload = paramsObj.optNullableString(ResponseConstants.KEY_PAYLOAD) ?: payload

                    // Convert schema_crc to human-readable schema type
                    val schemaCrc = paramsObj.optInt(ResponseConstants.KEY_SCHEMA_CRC, -1)
                    schema = when (schemaCrc) {
                        0 -> "text"
                        1 -> "binary"
                        2 -> "cell"
                        else -> schema
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to parse sign data params", e)
                }
            }
        }

        return SignDataRequest(
            payload = payload,
            schema = schema,
        )
    }

    private fun handleSignerSignRequest(data: JSONObject) {
        val signerId = data.optString(ResponseConstants.KEY_SIGNER_ID)
        val requestId = data.optString(ResponseConstants.KEY_REQUEST_ID)
        val dataArray = data.optJSONArray(ResponseConstants.KEY_DATA)

        if (signerId.isNotEmpty() && requestId.isNotEmpty() && dataArray != null) {
            val signer: WalletSigner? = signerManager.getSigner(signerId)
            if (signer != null) {
                val dataBytes = ByteArray(dataArray.length()) { i -> dataArray.optInt(i).toByte() }

                CoroutineScope(Dispatchers.IO).launch {
                    try {
                        val signature = signer.sign(dataBytes)
                        engine.respondToSignRequest(signerId, requestId, signature, null)
                    } catch (e: Exception) {
                        Log.e(TAG, "Signer failed to sign data", e)
                        engine.respondToSignRequest(signerId, requestId, null, e.message ?: "Signing failed")
                    }
                }
            } else {
                Log.w(TAG, "Unknown signer ID: $signerId")
            }
        }
    }

    private fun JSONObject.optNullableString(key: String): String? {
        val value = opt(key)
        return when (value) {
            null, JSONObject.NULL -> null
            else -> value.toString()
        }
    }

    private companion object {
        private const val TAG = LogConstants.TAG_WEBVIEW_ENGINE
        private const val ERROR_FAILED_PARSE_CONNECT_REQUEST = "Failed to parse ConnectRequestEvent"
        private const val ERROR_FAILED_PARSE_TRANSACTION_REQUEST = "Failed to parse TransactionRequestEvent"
        private const val ERROR_FAILED_PARSE_SIGN_DATA_REQUEST = "Failed to parse SignDataRequestEvent"
        private const val ERROR_FAILED_PARSE_SIGN_DATA_PARAMS = "Failed to parse params for sign data"
    }
}
