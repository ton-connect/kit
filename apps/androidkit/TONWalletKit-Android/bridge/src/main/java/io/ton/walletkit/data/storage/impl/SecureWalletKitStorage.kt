package io.ton.walletkit.data.storage.impl

import android.content.Context
import android.util.Log
import androidx.core.content.edit
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import io.ton.walletkit.domain.constants.LogConstants
import io.ton.walletkit.domain.constants.MiscConstants
import io.ton.walletkit.domain.constants.StorageConstants
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Secure storage implementation using Android Keystore and EncryptedSharedPreferences.
 *
 * This class provides **raw key-value storage primitives** for the TypeScript WalletKit bridge.
 * It does NOT manage wallets, sessions, or preferences - those are handled by TypeScript
 * and stored via the bridge adapter (BridgeStorageAdapter).
 *
 * Security Features:
 * - EncryptedSharedPreferences with AES-256-GCM encryption
 * - Hardware-backed master key when available (StrongBox)
 * - Isolated storage namespace
 *
 * Architecture:
 * This mirrors WalletKitKeychainStorage, which also provides only storage primitives.
 * TypeScript WalletKit handles all business logic (sessions, events, deduplication).
 *
 * @param context Application context
 * @param sharedPrefsName Name for the encrypted SharedPreferences file
 * @suppress This is an internal implementation class.
 */
internal class SecureWalletKitStorage(
    context: Context,
    sharedPrefsName: String = StorageConstants.DEFAULT_SECURE_STORAGE_NAME,
) {
    private val appContext = context.applicationContext

    // Master key for EncryptedSharedPreferences
    private val masterKey: MasterKey by lazy {
        try {
            MasterKey.Builder(appContext)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()
        } catch (e: Exception) {
            Log.e(TAG, ERROR_FAILED_CREATE_MASTER_KEY, e)
            throw SecurityException(ERROR_FAILED_INIT_SECURE_STORAGE, e)
        }
    }

    // EncryptedSharedPreferences for storing data
    private val encryptedPrefs by lazy {
        try {
            EncryptedSharedPreferences.create(
                appContext,
                sharedPrefsName,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
            )
        } catch (e: Exception) {
            Log.e(TAG, ERROR_FAILED_CREATE_ENCRYPTED_PREFS, e)
            throw SecurityException(ERROR_FAILED_INIT_SECURE_STORAGE, e)
        }
    }

    // ========== Raw Key-Value Storage for Bridge ==========

    /**
     * Get a raw value from encrypted storage (used by BridgeStorageAdapter).
     * @param key The storage key
     * @return The stored value, or null if not found
     */
    suspend fun getRawValue(key: String): String? = withContext(Dispatchers.IO) {
        try {
            encryptedPrefs.getString(key, null)
        } catch (e: Exception) {
            Log.e(TAG, ERROR_FAILED_GET_RAW_VALUE + key, e)
            null
        }
    }

    /**
     * Set a raw value in encrypted storage (used by BridgeStorageAdapter).
     * @param key The storage key
     * @param value The value to store
     */
    suspend fun setRawValue(
        key: String,
        value: String,
    ) {
        withContext(Dispatchers.IO) {
            try {
                encryptedPrefs.edit {
                    putString(key, value)
                }
            } catch (e: Exception) {
                Log.e(TAG, ERROR_FAILED_SET_RAW_VALUE + key, e)
                throw e
            }
        }
    }

    /**
     * Remove a raw value from encrypted storage (used by BridgeStorageAdapter).
     * @param key The storage key to remove
     */
    suspend fun removeRawValue(key: String) {
        withContext(Dispatchers.IO) {
            try {
                encryptedPrefs.edit {
                    remove(key)
                }
            } catch (e: Exception) {
                Log.e(TAG, ERROR_FAILED_REMOVE_RAW_VALUE + key, e)
            }
        }
    }

    /**
     * Clear all bridge-related data from storage (keys starting with bridge: prefix).
     */
    suspend fun clearBridgeData() {
        withContext(Dispatchers.IO) {
            try {
                val bridgeKeys = encryptedPrefs.all.keys.filter { it.startsWith(StorageConstants.KEY_PREFIX_BRIDGE) }
                encryptedPrefs.edit {
                    bridgeKeys.forEach { remove(it) }
                }
                Log.d(TAG, ERROR_CLEARED_BRIDGE_STORAGE_KEYS + bridgeKeys.size + MiscConstants.BRIDGE_STORAGE_KEYS_COUNT_SUFFIX)
            } catch (e: Exception) {
                Log.e(TAG, ERROR_FAILED_CLEAR_BRIDGE_DATA, e)
            }
        }
    }

    companion object {
        private const val TAG = LogConstants.TAG_SECURE_STORAGE

        // Security / Initialization Errors
        const val ERROR_FAILED_INIT_SECURE_STORAGE = "Failed to initialize secure storage"
        const val ERROR_FAILED_CREATE_MASTER_KEY = "Failed to create MasterKey"
        const val ERROR_FAILED_CREATE_ENCRYPTED_PREFS = "Failed to create EncryptedSharedPreferences"

        // Storage Operation Errors
        const val ERROR_CLEARED_BRIDGE_STORAGE_KEYS = "Cleared "
        const val ERROR_FAILED_CLEAR_BRIDGE_DATA = "Failed to clear bridge data"
        const val ERROR_FAILED_GET_RAW_VALUE = "Failed to get raw value: "
        const val ERROR_FAILED_SET_RAW_VALUE = "Failed to set raw value: "
        const val ERROR_FAILED_REMOVE_RAW_VALUE = "Failed to remove raw value: "
    }
}
