package io.ton.walletkit.domain.constants

/**
 * Constants for storage keys and prefixes used throughout the SDK.
 *
 * These constants ensure consistent key naming across storage implementations
 * and make refactoring safer by avoiding hardcoded string literals.
 */
object StorageConstants {
    /**
     * Prefix for wallet-related storage keys.
     *
     * Format: "wallet:{accountId}"
     */
    const val KEY_PREFIX_WALLET = "wallet:"

    /**
     * Prefix for bridge-related storage keys (used by JavaScript bundle).
     *
     * Format: "bridge:{key}"
     */
    const val KEY_PREFIX_BRIDGE = "bridge:"

    /**
     * Prefix for session-related storage keys.
     *
     * Format: "session:{sessionId}"
     */
    const val KEY_PREFIX_SESSION = "session:"

    /**
     * Prefix for configuration storage keys.
     *
     * Format: "config:{configId}"
     */
    const val KEY_PREFIX_CONFIG = "config:"

    /**
     * Prefix for user preferences storage keys.
     *
     * Format: "preferences:{prefKey}"
     */
    const val KEY_PREFIX_PREFERENCES = "preferences:"

    /**
     * Default name for secure storage SharedPreferences file.
     */
    const val DEFAULT_SECURE_STORAGE_NAME = "walletkit_secure_storage"

    /**
     * Name for bridge storage SharedPreferences file.
     */
    const val BRIDGE_STORAGE_NAME = "walletkit_bridge_storage"

    /**
     * Keystore alias for mnemonic encryption.
     */
    const val MNEMONIC_KEYSTORE_KEY = "walletkit_mnemonic_key"

    /**
     * Keystore alias for session private key encryption.
     */
    const val SESSION_KEYSTORE_KEY = "walletkit_session_key"

    /**
     * Keystore alias for API key encryption.
     */
    const val API_KEY_KEYSTORE_KEY = "walletkit_apikey"

    /**
     * Storage key for bridge configuration.
     */
    const val BRIDGE_CONFIG_KEY = "bridge_config"

    /**
     * Storage key for user preferences.
     */
    const val USER_PREFERENCES_KEY = "user_preferences"
}
