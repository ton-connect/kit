package io.ton.walletkit.demo.data.storage

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import io.ton.walletkit.demo.domain.model.WalletInterfaceType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.security.MessageDigest

/**
 * Secure implementation of DemoAppStorage using Android Keystore + EncryptedSharedPreferences.
 * Encrypts sensitive data like wallet mnemonics and password hash.
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
        WALLET_PREFS_NAME,
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )

    private val userPrefs: SharedPreferences = EncryptedSharedPreferences.create(
        appContext,
        USER_PREFS_NAME,
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )

    // In-memory unlock state (never persisted for security)
    private var isUnlockedInMemory = false

    override suspend fun saveWallet(address: String, record: WalletRecord): Unit = withContext(Dispatchers.IO) {
        val json = JSONObject().apply {
            put(KEY_MNEMONIC, JSONArray(record.mnemonic))
            put(KEY_NAME, record.name)
            put(KEY_INTERFACE_TYPE, record.interfaceType)
            put(KEY_CREATED_AT, record.createdAt)
            put(KEY_NETWORK, record.network)
            put(KEY_VERSION, record.version)
        }
        walletPrefs.edit().putString(walletKey(address), json.toString()).apply()
        Log.d(TAG, "Saved wallet: $address")
    }

    override suspend fun loadWallet(address: String): WalletRecord? = withContext(Dispatchers.IO) {
        val jsonString = walletPrefs.getString(walletKey(address), null) ?: return@withContext null
        try {
            val json = JSONObject(jsonString)
            val mnemonicArray = json.getJSONArray(KEY_MNEMONIC)
            val mnemonic = List(mnemonicArray.length()) { mnemonicArray.getString(it) }
            val name = json.getString(KEY_NAME)
            val network = json.getString(KEY_NETWORK)
            val version = json.getString(KEY_VERSION)
            val interfaceType = if (json.has(KEY_INTERFACE_TYPE)) {
                json.getString(KEY_INTERFACE_TYPE)
            } else {
                WalletInterfaceType.MNEMONIC.value
            }
            val createdAt = if (json.has(KEY_CREATED_AT)) json.getLong(KEY_CREATED_AT) else System.currentTimeMillis()

            WalletRecord(
                mnemonic = mnemonic,
                name = name,
                network = network,
                version = version,
                createdAt = createdAt,
                interfaceType = interfaceType,
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
        isUnlockedInMemory = false
        Log.d(TAG, "Cleared all demo app storage")
    }

    // ========== Password Management ==========

    override fun isPasswordSet(): Boolean = userPrefs.contains(PREF_PASSWORD_HASH)

    override fun setPassword(password: String) {
        val hash = hashPassword(password)
        userPrefs.edit().putString(PREF_PASSWORD_HASH, hash).apply()
        Log.d(TAG, "Password hash saved")
    }

    override fun verifyPassword(password: String): Boolean {
        val storedHash = userPrefs.getString(PREF_PASSWORD_HASH, null) ?: return false
        val providedHash = hashPassword(password)
        return storedHash == providedHash
    }

    override fun isUnlocked(): Boolean = isUnlockedInMemory

    override fun setUnlocked(unlocked: Boolean) {
        isUnlockedInMemory = unlocked
        Log.d(TAG, "Unlock state set to: $unlocked (in-memory only)")
    }

    override fun resetPassword() {
        userPrefs.edit().remove(PREF_PASSWORD_HASH).apply()
        isUnlockedInMemory = false
        Log.d(TAG, "Password reset")
    }

    /**
     * Hash a password using SHA-256.
     */
    private fun hashPassword(password: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val hashBytes = digest.digest(password.toByteArray())
        return hashBytes.joinToString("") { "%02x".format(it) }
    }

    private fun walletKey(address: String) = "$WALLET_PREFIX$address"

    companion object {
        private const val TAG = "SecureDemoAppStorage"
        private const val WALLET_PREFS_NAME = "walletkit_demo_wallets"
        private const val USER_PREFS_NAME = "walletkit_demo_prefs"
        private const val WALLET_PREFIX = "wallet:"
        private const val PREF_ACTIVE_WALLET = "active_wallet_address"
        private const val PREF_PASSWORD_HASH = "password_hash"
        private const val KEY_MNEMONIC = "mnemonic"
        private const val KEY_NAME = "name"
        private const val KEY_INTERFACE_TYPE = "interfaceType"
        private const val KEY_CREATED_AT = "createdAt"
        private const val KEY_NETWORK = "network"
        private const val KEY_VERSION = "version"
    }
}
