package io.ton.walletkit.presentation.storage.bridge

import android.content.Context
import android.util.Log
import io.ton.walletkit.data.storage.impl.SecureWalletKitStorage
import io.ton.walletkit.domain.constants.LogConstants
import io.ton.walletkit.domain.constants.StorageConstants
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Secure implementation of BridgeStorageAdapter using EncryptedSharedPreferences.
 * This adapter provides the bridge with access to Android secure storage, enabling
 * the JavaScript bundle to persist wallet and session data between app restarts.
 *
 * All data is encrypted at rest using Android Keystore-backed encryption.
 *
 * Storage Keys:
 * - "bridge:*" - Raw key-value pairs from JavaScript bundle
 * - Automatically encrypted by EncryptedSharedPreferences
 *
 * @param context Application context
 */
class SecureBridgeStorageAdapter(
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
