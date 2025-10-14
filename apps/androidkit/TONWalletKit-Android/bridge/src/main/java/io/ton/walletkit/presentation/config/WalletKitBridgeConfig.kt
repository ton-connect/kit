package io.ton.walletkit.presentation.config

import io.ton.walletkit.domain.constants.JsonConstants
import io.ton.walletkit.domain.constants.NetworkConstants

/**
 * Configuration for WalletKit bridge initialization.
 *
 * @property network Network to use ("mainnet" or "testnet")
 * @property apiUrl Optional custom API URL for TON client
 * @property bridgeUrl Optional custom bridge URL for TonConnect
 * @property bridgeName Optional custom bridge name
 * @property tonClientEndpoint Optional custom TON client endpoint
 * @property tonApiUrl Optional custom TON API URL
 * @property apiKey Optional API key for TON API
 * @property enablePersistentStorage Enable persistent storage for wallets and sessions (default: true).
 *                                   When false, all data is stored in memory and cleared on app restart.
 *                                   Use cases for disabling:
 *                                   - Testing/development (quick reset)
 *                                   - Privacy-focused session-only mode
 *                                   - Kiosk/demo applications
 *                                   - Compliance requirements for ephemeral storage
 * @property appName Application name to report to dApps (defaults to app label from manifest)
 * @property appVersion Application version to report to dApps (defaults to versionName from manifest)
 * @property maxMessages Maximum number of messages supported in SendTransaction (default: 4)
 * @property signDataTypes Supported sign data types (default: ["text", "binary", "cell"])
 * @property walletImageUrl Wallet icon URL for TonConnect manifest (required for production)
 * @property walletAboutUrl Wallet about/website URL for TonConnect manifest (required for production)
 * @property walletUniversalUrl Universal link URL for deep linking (optional, recommended for production)
 */
data class WalletKitBridgeConfig(
    val network: String = NetworkConstants.DEFAULT_NETWORK,
    val apiUrl: String? = null,
    val bridgeUrl: String? = null,
    val bridgeName: String? = null,
    val tonClientEndpoint: String? = null,
    val tonApiUrl: String? = null,
    val apiKey: String? = null,
    val enablePersistentStorage: Boolean = true,
    val appName: String? = null,
    val appVersion: String? = null,
    val maxMessages: Int = 4,
    val signDataTypes: List<String> = listOf(
        JsonConstants.VALUE_SIGN_DATA_TEXT,
        JsonConstants.VALUE_SIGN_DATA_BINARY,
        JsonConstants.VALUE_SIGN_DATA_CELL,
    ),
    val walletImageUrl: String? = null,
    val walletAboutUrl: String? = null,
    val walletUniversalUrl: String? = null,
)
