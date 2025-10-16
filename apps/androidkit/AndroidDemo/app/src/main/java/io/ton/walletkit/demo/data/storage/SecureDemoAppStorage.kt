package io.ton.walletkit.demo.data.storage

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject

/**
 * Secure implementation of DemoAppStorage using Android Keystore + EncryptedSharedPreferences.
 * Encrypts sensitive data like wallet mnemonics.
 *
 * This is demo app internal storage - NOT part of the SDK.
 */
class SecureDemoAppStorage(context: Context) : DemoAppStorage {
    private val appContext = context.applicationContext

    private val masterKey = MasterKey.Builder(appContext)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val walletPrefs: SharedPreferences = EncryptedSharedPreferences.create(
        appContext,
        "walletkit_demo_wallets",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )

    private val userPrefs: SharedPreferences = EncryptedSharedPreferences.create(
        appContext,
        "walletkit_demo_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )

    override suspend fun saveWallet(address: String, record: WalletRecord): Unit = withContext(Dispatchers.IO) {
        val json = JSONObject().apply {
            put("mnemonic", JSONArray(record.mnemonic))
            put("name", record.name)
            put("network", record.network)
            put("version", record.version)
        }
        walletPrefs.edit().putString(walletKey(address), json.toString()).apply()
        Log.d(TAG, "Saved wallet: $address")
    }

    override suspend fun loadWallet(address: String): WalletRecord? = withContext(Dispatchers.IO) {
        val jsonString = walletPrefs.getString(walletKey(address), null) ?: return@withContext null
        try {
            val json = JSONObject(jsonString)
            val mnemonicArray = json.getJSONArray("mnemonic")
            val mnemonic = List(mnemonicArray.length()) { mnemonicArray.getString(it) }
            WalletRecord(
                mnemonic = mnemonic,
                name = json.getString("name"),
                network = json.getString("network"),
                version = json.getString("version"),
            )
        } catch (e: Exception) {
            Log.e(TAG, "Failed to parse wallet record for $address", e)
            null
        }
    }

    override suspend fun loadAllWallets(): Map<String, WalletRecord> = withContext(Dispatchers.IO) {
        val result = mutableMapOf<String, WalletRecord>()
        walletPrefs.all.forEach { (key, _) ->
            if (key.startsWith(WALLET_PREFIX)) {
                val address = key.removePrefix(WALLET_PREFIX)
                loadWallet(address)?.let { record ->
                    result[address] = record
                }
            }
        }
        result
    }

    override suspend fun clear(address: String): Unit = withContext(Dispatchers.IO) {
        walletPrefs.edit().remove(walletKey(address)).apply()
        Log.d(TAG, "Cleared wallet: $address")
    }

    override suspend fun saveUserPreferences(preferences: UserPreferences): Unit = withContext(Dispatchers.IO) {
        userPrefs.edit().apply {
            preferences.activeWalletAddress?.let {
                putString(PREF_ACTIVE_WALLET, it)
            } ?: remove(PREF_ACTIVE_WALLET)
        }.apply()
        Log.d(TAG, "Saved user preferences")
    }

    override suspend fun loadUserPreferences(): UserPreferences? = withContext(Dispatchers.IO) {
        val activeWallet = userPrefs.getString(PREF_ACTIVE_WALLET, null)
        if (activeWallet != null) {
            UserPreferences(activeWalletAddress = activeWallet)
        } else {
            null
        }
    }

    override suspend fun clearAll(): Unit = withContext(Dispatchers.IO) {
        walletPrefs.edit().clear().apply()
        userPrefs.edit().clear().apply()
        Log.d(TAG, "Cleared all demo app storage")
    }

    private fun walletKey(address: String) = "$WALLET_PREFIX$address"

    companion object {
        private const val TAG = "SecureDemoAppStorage"
        private const val WALLET_PREFIX = "wallet:"
        private const val PREF_ACTIVE_WALLET = "active_wallet_address"
    }
}
