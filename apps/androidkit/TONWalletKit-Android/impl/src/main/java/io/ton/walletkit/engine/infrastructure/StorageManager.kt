package io.ton.walletkit.engine.infrastructure

import android.util.Log
import io.ton.walletkit.internal.constants.LogConstants
import io.ton.walletkit.storage.BridgeStorageAdapter

/**
 * Mediates storage operations between the JavaScript bridge and the Android storage adapter.
 *
 * This component enforces the persistent storage flag and preserves legacy logging behaviour for
 * debugging. All operations must be invoked from a coroutine context; callers that need a blocking
 * API (e.g., JavaScript interfaces) should wrap the calls in `runBlocking`.
 *
 * @suppress Internal component. Use through [WebViewWalletKitEngine].
 */
internal class StorageManager(
    private val storageAdapter: BridgeStorageAdapter,
    private val isPersistentStorageEnabled: () -> Boolean,
) {
    suspend fun get(key: String): String? {
        if (!isPersistentStorageEnabled()) {
            return null
        }

        return try {
            Log.d(TAG, "storageGet called with key=$key")
            storageAdapter.get(key)
        } catch (e: Exception) {
            Log.e(TAG, LogConstants.MSG_STORAGE_GET_FAILED + key, e)
            null
        }
    }

    suspend fun set(key: String, value: String) {
        if (!isPersistentStorageEnabled()) {
            return
        }

        try {
            Log.d(TAG, "storageSet called with key=$key, valueLength=${value.length}")
            storageAdapter.set(key, value)
        } catch (e: Exception) {
            Log.e(TAG, LogConstants.MSG_STORAGE_SET_FAILED + key, e)
        }
    }

    suspend fun remove(key: String) {
        if (!isPersistentStorageEnabled()) {
            return
        }

        try {
            Log.d(TAG, "storageRemove called with key=$key")
            storageAdapter.remove(key)
        } catch (e: Exception) {
            Log.e(TAG, LogConstants.MSG_STORAGE_REMOVE_FAILED + key, e)
        }
    }

    suspend fun clear() {
        if (!isPersistentStorageEnabled()) {
            return
        }

        try {
            storageAdapter.clear()
        } catch (e: Exception) {
            Log.e(TAG, LogConstants.MSG_STORAGE_CLEAR_FAILED, e)
        }
    }

    private companion object {
        private const val TAG = LogConstants.TAG_WEBVIEW_ENGINE
    }
}
