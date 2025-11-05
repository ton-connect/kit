package io.ton.walletkit.storage

import android.content.Context
import android.util.Log
import io.ton.walletkit.internal.constants.LogConstants
import io.ton.walletkit.internal.constants.StorageConstants
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Secure implementation of BridgeStorageAdapter using EncryptedSharedPreferences.
 *
 * This adapter provides secure persistent storage for the WalletKit JavaScript bridge,
 * replacing ephemeral WebView LocalStorage with Android's encrypted storage.
 *
 * Security:
 * - Uses EncryptedSharedPreferences with AES256-GCM encryption
 * - Hardware-backed master key when available
 * - All keys prefixed with "bridge:" for isolation
 *
 * Thread Safety:
 * - All operations are thread-safe via coroutine dispatchers
 * - Safe for concurrent access from multiple threads
 *
 * @suppress This is an internal implementation class.
 */
internal class SecureBridgeStorageAdapter(
    context: Context,
) : BridgeStorageAdapter {
    private val appContext = context.applicationContext
    private val secureStorage = SecureWalletKitStorage(appContext, StorageConstants.BRIDGE_STORAGE_NAME)

    override suspend fun get(key: String): String? = withContext(Dispatchers.IO) {
        try {
            secureStorage.getRawValue(bridgeKey(key))
        } catch (e: Exception) {
            Log.e(TAG, ERROR_FAILED_GET_RAW_VALUE + key, e)
            null
        }
    }

    override suspend fun set(
        key: String,
        value: String,
    ) {
        withContext(Dispatchers.IO) {
            try {
                secureStorage.setRawValue(bridgeKey(key), value)
            } catch (e: Exception) {
                Log.e(TAG, ERROR_FAILED_SET_RAW_VALUE + key, e)
                throw e
            }
        }
    }

    override suspend fun remove(key: String) {
        withContext(Dispatchers.IO) {
            try {
                secureStorage.removeRawValue(bridgeKey(key))
            } catch (e: Exception) {
                Log.e(TAG, ERROR_FAILED_REMOVE_RAW_VALUE + key, e)
            }
        }
    }

    override suspend fun clear() {
        withContext(Dispatchers.IO) {
            try {
                secureStorage.clearBridgeData()
            } catch (e: Exception) {
                Log.e(TAG, ERROR_FAILED_CLEAR_BRIDGE_DATA, e)
            }
        }
    }

    private fun bridgeKey(key: String) = StorageConstants.KEY_PREFIX_BRIDGE + key

    companion object {
        private const val TAG = LogConstants.TAG_BRIDGE_STORAGE

        // Storage Errors
        const val ERROR_FAILED_GET_RAW_VALUE = "Failed to get raw value: "
        const val ERROR_FAILED_SET_RAW_VALUE = "Failed to set raw value: "
        const val ERROR_FAILED_REMOVE_RAW_VALUE = "Failed to remove raw value: "
        const val ERROR_FAILED_CLEAR_BRIDGE_DATA = "Failed to clear bridge data"
    }
}
