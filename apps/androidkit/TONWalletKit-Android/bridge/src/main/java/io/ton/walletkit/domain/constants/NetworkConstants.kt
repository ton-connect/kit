package io.ton.walletkit.domain.constants

/**
 * Constants for TON network configuration and endpoints.
 *
 * These constants define the available networks and their default API endpoints
 * used throughout the SDK.
 */
object NetworkConstants {
    /**
     * Mainnet network identifier.
     */
    const val NETWORK_MAINNET = "mainnet"

    /**
     * Testnet network identifier (default for development).
     */
    const val NETWORK_TESTNET = "testnet"

    /**
     * Default network used by the SDK.
     */
    const val DEFAULT_NETWORK = NETWORK_TESTNET

    /**
     * Default TON API URL for testnet.
     */
    const val DEFAULT_TESTNET_API_URL = "https://testnet.tonapi.io"

    /**
     * Default TON API URL for mainnet.
     */
    const val DEFAULT_MAINNET_API_URL = "https://tonapi.io"

    /**
     * Default wallet image URL.
     */
    const val DEFAULT_WALLET_IMAGE_URL = "https://wallet.ton.org/assets/ui/qr-logo.png"

    /**
     * Default wallet about URL.
     */
    const val DEFAULT_WALLET_ABOUT_URL = "https://wallet.ton.org"

    /**
     * Default app version when unable to retrieve from package manager.
     */
    const val DEFAULT_APP_VERSION = "1.0.0"

    /**
     * Maximum protocol version supported by the SDK.
     */
    const val MAX_PROTOCOL_VERSION = 2
}
