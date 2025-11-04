package io.ton.walletkit.storage

/**
 * Storage adapter interface for the WalletKit bridge to persist data between app restarts.
 * This enables the JavaScript bundle to use Android secure storage instead of ephemeral
 * WebView LocalStorage or memory storage.
 *
 * The bridge calls these methods via JavascriptInterface to persist:
 * - Wallet metadata (addresses, public keys, versions)
 * - Session data (session IDs, dApp info, private keys)
 * - User preferences (active wallet, network settings)
 *
 * Implementations should use secure storage (e.g., EncryptedSharedPreferences) for
 * sensitive data like session private keys.
 *
 * @suppress This is an internal interface. Partners should not implement or use this directly.
 */
internal interface BridgeStorageAdapter {
    /**
     * Get a value from storage by key.
     * @param key The storage key
     * @return The stored value as a JSON string, or null if not found
     */
    suspend fun get(key: String): String?

    /**
     * Set a value in storage.
     * @param key The storage key
     * @param value The value to store as a JSON string
     */
    suspend fun set(key: String, value: String)

    /**
     * Remove a value from storage.
     * @param key The storage key to remove
     */
    suspend fun remove(key: String)

    /**
     * Clear all storage data.
     */
    suspend fun clear()
}
