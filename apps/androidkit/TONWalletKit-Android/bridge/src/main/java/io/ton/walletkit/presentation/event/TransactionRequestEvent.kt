package io.ton.walletkit.presentation.event

import io.ton.walletkit.domain.constants.JsonConstants
import io.ton.walletkit.domain.model.DAppInfo
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Represents a transaction request event from the bridge.
 * Provides the typed representation of the event data for consumers.
 */
@Serializable
data class TransactionRequestEvent(
    val id: String? = null,
    val from: String? = null,
    val walletAddress: String? = null,
    val domain: String? = null,
    val sessionId: String? = null,
    val messageId: String? = null,
    val request: Request? = null,
    val dAppInfo: DAppInfo? = null,
    val preview: Preview? = null,
    val error: String? = null,

    // JS Bridge fields for internal browser
    val isJsBridge: Boolean? = null,
    val tabId: String? = null,
    val isLocal: Boolean? = null,
    val traceId: String? = null,
    val method: String? = null,
    val params: List<String>? = null,
) {
    @Serializable
    data class Request(
        val messages: List<Message>? = null,
        val network: String? = null,
        @SerialName(JsonConstants.KEY_VALID_UNTIL)
        val validUntil: Long? = null,
        val from: String? = null,
    )

    @Serializable
    data class Message(
        val address: String? = null,
        val amount: String? = null,
        val payload: String? = null,
        val stateInit: String? = null,
        val mode: Int? = null,
    )

    @Serializable
    data class Preview(
        val kind: String? = null,
        val content: String? = null,
        val manifest: Manifest? = null,
    )

    @Serializable
    data class Manifest(
        val name: String? = null,
        val url: String? = null,
        val iconUrl: String? = null,
    )
}
