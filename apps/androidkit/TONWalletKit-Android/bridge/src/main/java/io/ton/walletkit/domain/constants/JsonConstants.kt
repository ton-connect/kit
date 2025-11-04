package io.ton.walletkit.domain.constants

/**
 * Constants for JSON object keys used in storage serialization.
 *
 * These constants ensure consistent JSON key naming when serializing/deserializing
 * wallet records, session hints, and bridge configuration.
 *
 * @suppress Internal implementation constants. Not part of public API.
 */
internal object JsonConstants {
    // Wallet record keys
    /**
     * JSON key for mnemonic phrase array.
     */
    const val KEY_MNEMONIC = "mnemonic"

    /**
     * JSON key for wallet words (alternative to mnemonic).
     */
    const val KEY_WORDS = "words"

    /**
     * JSON key for mnemonic type (e.g., ton or bip39).
     */
    const val KEY_MNEMONIC_TYPE = "mnemonicType"

    /**
     * JSON key for wallet name.
     */
    const val KEY_NAME = "name"

    /**
     * JSON key for network identifier.
     */
    const val KEY_NETWORK = "network"

    /**
     * JSON key for wallet version.
     */
    const val KEY_VERSION = "version"

    /**
     * JSON key for wallet adapter object.
     */
    const val KEY_WALLET = "wallet"

    // Session hint keys
    /**
     * JSON key for manifest URL.
     */
    const val KEY_MANIFEST_URL = "manifestUrl"

    /**
     * JSON key for dApp URL.
     */
    const val KEY_DAPP_URL = "dAppUrl"

    /**
     * JSON key for icon URL.
     */
    const val KEY_ICON_URL = "iconUrl"

    /**
     * JSON key for URL parameter.
     */
    const val KEY_URL = "url"

    // Bridge config keys
    /**
     * JSON key for API URL configuration.
     */
    const val KEY_API_URL = "apiUrl"

    /**
     * JSON key for TON API URL configuration.
     */
    const val KEY_TON_API_URL = "tonApiUrl"

    /**
     * JSON key for bridge URL configuration.
     */
    const val KEY_BRIDGE_URL = "bridgeUrl"

    /**
     * JSON key for bridge name configuration.
     */
    const val KEY_BRIDGE_NAME = "bridgeName"

    // Wallet manifest keys
    /**
     * JSON key for wallet manifest object.
     */
    const val KEY_WALLET_MANIFEST = "walletManifest"

    /**
     * JSON key for app name in manifest.
     */
    const val KEY_APP_NAME = "appName"

    /**
     * JSON key for image URL in manifest.
     */
    const val KEY_IMAGE_URL = "imageUrl"

    /**
     * JSON key for about URL in manifest.
     */
    const val KEY_ABOUT_URL = "aboutUrl"

    /**
     * JSON key for universal URL in manifest.
     */
    const val KEY_UNIVERSAL_URL = "universalUrl"

    /**
     * JSON key for platforms array in manifest.
     */
    const val KEY_PLATFORMS = "platforms"

    // Device info keys
    /**
     * JSON key for device info object.
     */
    const val KEY_DEVICE_INFO = "deviceInfo"

    /**
     * JSON key for device object in TonConnect payloads.
     */
    const val KEY_DEVICE = "device"

    /**
     * JSON key for platform in device info.
     */
    const val KEY_PLATFORM = "platform"

    /**
     * JSON key for app version in device info.
     */
    const val KEY_APP_VERSION = "appVersion"

    /**
     * JSON key for max protocol version in device info.
     */
    const val KEY_MAX_PROTOCOL_VERSION = "maxProtocolVersion"

    /**
     * JSON key for features array in device info.
     */
    const val KEY_FEATURES = "features"

    // Transaction/Request keys
    /**
     * JSON key for request ID.
     */
    const val KEY_ID = "id"

    /**
     * JSON key for sender/from address.
     */
    const val KEY_FROM = "from"

    /**
     * JSON key for valid until timestamp.
     */
    const val KEY_VALID_UNTIL = "valid_until"

    /**
     * JSON key for sign data type.
     */
    const val KEY_TYPE = "type"

    // Sign data type values
    /**
     * JSON value for text sign data type.
     */
    const val VALUE_SIGN_DATA_TEXT = "text"

    /**
     * JSON value for binary sign data type.
     */
    const val VALUE_SIGN_DATA_BINARY = "binary"

    /**
     * JSON value for cell sign data type.
     */
    const val VALUE_SIGN_DATA_CELL = "cell"

    /**
     * TonConnect payload item name for wallet address permission.
     */
    const val VALUE_TON_ADDR_ITEM = "ton_addr"

    /** JSON value for native TON asset type. */
    const val VALUE_ASSET_TON = "ton"

    /** JSON value for jetton asset type. */
    const val VALUE_ASSET_JETTON = "jetton"

    /** JSON value for transaction preview error type. */
    const val VALUE_PREVIEW_ERROR = "error"

    /** JSON value for transaction preview success type. */
    const val VALUE_PREVIEW_SUCCESS = "success"

    // Transaction feature name
    /**
     * Feature name for SendTransaction capability.
     */
    const val FEATURE_SEND_TRANSACTION = "SendTransaction"

    /**
     * Feature name for SignData capability.
     */
    const val FEATURE_SIGN_DATA = "SignData"

    /**
     * JSON key for max messages in SendTransaction feature.
     */
    const val KEY_MAX_MESSAGES = "maxMessages"

    /**
     * JSON key for types array in SignData feature.
     */
    const val KEY_TYPES = "types"

    /**
     * JSON key for transaction hash.
     */
    const val KEY_HASH = "hash"

    /**
     * JSON key for logical time.
     */
    const val KEY_LT = "lt"

    // Pending event keys (for automatic retry)
    /**
     * JSON key for event data payload.
     */
    const val KEY_DATA = "data"

    /**
     * JSON key for event timestamp.
     */
    const val KEY_TIMESTAMP = "timestamp"

    /**
     * JSON key for retry count.
     */
    const val KEY_RETRY_COUNT = "retryCount"

    /**
     * JSON key for a numeric count parameter (used by createTonMnemonic)
     */
    const val KEY_COUNT = "count"
}
