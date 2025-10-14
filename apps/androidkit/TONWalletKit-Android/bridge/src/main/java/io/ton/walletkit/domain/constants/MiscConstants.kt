package io.ton.walletkit.domain.constants

/**
 * Miscellaneous string constants used throughout the WalletKit SDK.
 * Contains various literals that don't fit into other constant categories.
 */
object MiscConstants {
    // String Delimiters and Separators
    const val SPACE_DELIMITER = " "
    const val EMPTY_STRING = ""

    // URL Schemes
    const val SCHEME_HTTPS = "https://"
    const val SCHEME_HTTP = "http://"

    // Comment Descriptions (for documentation purposes)
    const val COMMENT_WALLET_NAME_EXAMPLE = "Main Wallet"
    const val COMMENT_NETWORK_MAINNET = "mainnet"
    const val COMMENT_NETWORK_TESTNET = "testnet"
    const val COMMENT_WALLET_VERSION_EXAMPLE = "v4R2"

    // Storage Keys Info
    const val INFO_WALLET_KEY_FORMAT = "wallet:{accountId}"
    const val INFO_BRIDGE_KEY_FORMAT = "bridge:{key}"
    const val INFO_SESSION_KEY_FORMAT = "session:{sessionId}"
    const val INFO_CONFIG_KEY_FORMAT = "config:{configId}"
    const val INFO_PREFERENCES_KEY_FORMAT = "preferences:{prefKey}"
    const val INFO_CLEAR_BRIDGE_KEYS_DESC = "Clear all bridge-related data from storage (keys starting with \"bridge:\")."

    // Numeric Constants
    const val BRIDGE_STORAGE_KEYS_COUNT_SUFFIX = " bridge storage keys"
}
