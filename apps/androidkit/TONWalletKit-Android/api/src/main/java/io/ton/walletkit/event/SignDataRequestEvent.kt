package io.ton.walletkit.event

import io.ton.walletkit.internal.constants.JsonConstants
import io.ton.walletkit.model.DAppInfo
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

/**
 * Represents a sign data request event from the bridge.
 * Provides the typed representation of the event data for consumers.
 */
@Serializable
data class SignDataRequestEvent(
    val id: String? = null,
    val from: String? = null,
    val walletAddress: String? = null,
    val domain: String? = null,
    val sessionId: String? = null,
    val messageId: String? = null,
    val request: Payload? = null,
    val dAppInfo: DAppInfo? = null,
    val preview: Preview? = null,

    // JS Bridge fields for internal browser
    val isJsBridge: Boolean? = null,
    val tabId: String? = null,
    val isLocal: Boolean? = null,
    val traceId: String? = null,
    val method: String? = null,
    // params can be either an array or an object depending on the protocol
    val params: JsonElement? = null,
) {
    @Serializable
    data class Payload(
        val network: String? = null,
        val from: String? = null,
        val type: SignDataType,
        val bytes: String? = null,
        val schema: String? = null,
        val cell: String? = null,
        val text: String? = null,
    )

    @Serializable
    data class Preview(
        val kind: SignDataType,
        val content: String? = null,
        val schema: String? = null,
    )
}

@Serializable
enum class SignDataType {
    @SerialName(JsonConstants.VALUE_SIGN_DATA_TEXT)
    TEXT,

    @SerialName(JsonConstants.VALUE_SIGN_DATA_BINARY)
    BINARY,

    @SerialName(JsonConstants.VALUE_SIGN_DATA_CELL)
    CELL,
}
