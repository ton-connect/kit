package io.ton.walletkit.demo.data.storage

import io.ton.walletkit.demo.domain.model.WalletInterfaceType

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

    // ========== Password Management ==========

    /**
     * Check if a password has been set.
     */
    fun isPasswordSet(): Boolean

    /**
     * Set/update the password (stores hash).
     */
    fun setPassword(password: String)

    /**
     * Verify if the provided password matches.
     */
    fun verifyPassword(password: String): Boolean

    /**
     * Check if the wallet is currently unlocked (in-memory only).
     */
    fun isUnlocked(): Boolean

    /**
     * Set the unlocked state (in-memory only for security).
     */
    fun setUnlocked(unlocked: Boolean)

    /**
     * Reset password data (called during wallet reset).
     */
    fun resetPassword()
}

/**
 * Wallet record stored in demo app storage.
 */
data class WalletRecord(
    val mnemonic: List<String>,
    val name: String,
    val network: String,
    val version: String,
    val createdAt: Long = System.currentTimeMillis(), // Unix timestamp in milliseconds
    val interfaceType: String = WalletInterfaceType.MNEMONIC.value, // "mnemonic" or "signer"
)

/**
 * User preferences for the demo app.
 */
data class UserPreferences(
    val activeWalletAddress: String? = null,
)
