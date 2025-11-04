package io.ton.walletkit.config

import io.ton.walletkit.internal.constants.JsonConstants
import io.ton.walletkit.model.TONNetwork
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Configuration for TONWalletKit initialization.
 *
 * Mirrors the shared TON Wallet Kit configuration contract for cross-platform consistency.
 *
 * @property network Blockchain network
 * @property walletManifest Wallet app manifest for TON Connect
 * @property bridge Bridge configuration
 * @property apiClient API client configuration (optional)
 * @property features Supported wallet features
 * @property storage Storage configuration
 */
@Serializable
data class TONWalletKitConfiguration(
    val network: TONNetwork,
    val walletManifest: Manifest,
    val bridge: Bridge,
    val apiClient: APIClient? = null,
    val features: List<Feature>,
    val storage: Storage = Storage(),
) {
    /**
     * Wallet manifest for TON Connect.
     *
     * @property name Wallet display name
     * @property appName Application name
     * @property imageUrl Wallet icon URL
     * @property tondns TON DNS name (optional)
     * @property aboutUrl About/website URL
     * @property universalLink Universal link URL for deep linking
     * @property deepLink Deep link URL scheme (optional)
     * @property bridgeUrl TON Connect bridge URL
     */
    @Serializable
    data class Manifest(
        val name: String,
        val appName: String,
        val imageUrl: String,
        val tondns: String? = null,
        val aboutUrl: String,
        val universalLink: String,
        val deepLink: String? = null,
        val bridgeUrl: String,
    )

    /**
     * Bridge connection configuration.
     *
     * @property bridgeUrl Bridge server URL
     * @property heartbeatInterval Heartbeat interval in milliseconds
     * @property reconnectInterval Reconnection interval in milliseconds
     * @property maxReconnectAttempts Maximum reconnection attempts
     */
    @Serializable
    data class Bridge(
        val bridgeUrl: String,
        val heartbeatInterval: Long? = null,
        val reconnectInterval: Long? = null,
        val maxReconnectAttempts: Int? = null,
    )

    /**
     * API client configuration.
     *
     * @property url API endpoint URL (optional, uses default if not provided)
     * @property key API key for authentication
     */
    @Serializable
    data class APIClient(
        val url: String? = null,
        val key: String,
    )

    /**
     * Storage configuration.
     *
     * @property persistent Enable persistent storage (true) or memory-only (false)
     */
    @Serializable
    data class Storage(
        val persistent: Boolean = true,
    )

    /**
     * Base interface for wallet features.
     * Implement this to define supported wallet capabilities.
     */
    interface Feature

    /**
     * Send transaction feature configuration.
     *
     * @property maxMessages Maximum messages per transaction
     * @property extraCurrencySupported Support for extra currencies beyond TON
     */
    @Serializable
    data class SendTransactionFeature(
        val maxMessages: Int? = null,
        val extraCurrencySupported: Boolean? = null,
    ) : Feature

    /**
     * Sign data feature configuration.
     *
     * @property types Supported sign data types (text, binary, cell)
     */
    @Serializable
    data class SignDataFeature(
        val types: List<SignDataType>,
    ) : Feature
}

/**
 * Types of data that can be signed.
 *
 * Mirrors the shared TON Wallet Kit specification.
 */
@Serializable
enum class SignDataType {
    /** Plain text data */
    @SerialName(JsonConstants.VALUE_SIGN_DATA_TEXT)
    TEXT,

    /** Binary data */
    @SerialName(JsonConstants.VALUE_SIGN_DATA_BINARY)
    BINARY,

    /** TON Cell data */
    @SerialName(JsonConstants.VALUE_SIGN_DATA_CELL)
    CELL,
}
