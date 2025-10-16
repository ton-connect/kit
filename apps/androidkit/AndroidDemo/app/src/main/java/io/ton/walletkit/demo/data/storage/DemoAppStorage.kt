package io.ton.walletkit.demo.data.storage

/**
 * Storage interface for the WalletKit demo app.
 * This is separate from the SDK's BridgeStorageAdapter and is used for
 * demo app-specific data like wallet mnemonics, metadata, and user preferences.
 *
 * NOT part of the SDK - this is demo app internal storage.
 */
interface DemoAppStorage {
    /**
     * Save a wallet record (mnemonic + metadata).
     */
    suspend fun saveWallet(address: String, record: WalletRecord)

    /**
     * Load a wallet record by address.
     */
    suspend fun loadWallet(address: String): WalletRecord?

    /**
     * Load all stored wallet records.
     */
    suspend fun loadAllWallets(): Map<String, WalletRecord>

    /**
     * Clear wallet data for a specific address.
     */
    suspend fun clear(address: String)

    /**
     * Save user preferences (active wallet, etc).
     */
    suspend fun saveUserPreferences(preferences: UserPreferences)

    /**
     * Load user preferences.
     */
    suspend fun loadUserPreferences(): UserPreferences?

    /**
     * Clear all demo app data.
     */
    suspend fun clearAll()
}

/**
 * Wallet record stored in demo app storage.
 */
data class WalletRecord(
    val mnemonic: List<String>,
    val name: String,
    val network: String,
    val version: String,
)

/**
 * User preferences for the demo app.
 */
data class UserPreferences(
    val activeWalletAddress: String? = null,
)
