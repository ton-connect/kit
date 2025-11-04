package io.ton.walletkit.presentation.event

import io.ton.walletkit.domain.model.DAppInfo
import kotlinx.serialization.Serializable

/**
 * Represents a connection request event from the bridge.
 * Provides the typed representation of the event data for consumers.
 */
@Serializable
data class ConnectRequestEvent(
    val id: String? = null,
    val from: String? = null,
    val preview: Preview? = null,
    val request: List<Request>? = null,
    val dAppInfo: DAppInfo? = null,
    var walletAddress: String? = null,

    // JS Bridge fields for internal browser
    val isJsBridge: Boolean? = null,
    val domain: String? = null,
    val tabId: String? = null,
    val sessionId: String? = null,
    val isLocal: Boolean? = null,
    val messageId: String? = null,
    val traceId: String? = null,
    val method: String? = null,
    val params: List<String>? = null,
) {
    @Serializable
    data class Preview(
        val manifestURL: String? = null,
        val manifest: Manifest? = null,
        val permissions: List<ConnectPermission>,
        val requestedItems: List<Request>? = null,
    )

    @Serializable
    data class Manifest(
        val name: String? = null,
        val description: String? = null,
        val url: String? = null,
        val iconUrl: String? = null,
    )

    @Serializable
    data class ConnectPermission(
        val name: String? = null,
        val title: String? = null,
        val description: String? = null,
    )

    @Serializable
    data class Request(
        val name: String? = null,
        val payload: String? = null,
    )
}
