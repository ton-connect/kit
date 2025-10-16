package io.ton.walletkit.data.storage.impl

import android.content.Context
import android.util.Base64
import android.util.Log
import androidx.core.content.edit
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import io.ton.walletkit.data.model.PendingEvent
import io.ton.walletkit.data.model.StoredBridgeConfig
import io.ton.walletkit.data.model.StoredSessionData
import io.ton.walletkit.data.model.StoredUserPreferences
import io.ton.walletkit.data.model.StoredWalletRecord
import io.ton.walletkit.data.storage.WalletKitStorage
import io.ton.walletkit.data.storage.encryption.CryptoManager
import io.ton.walletkit.domain.constants.JsonConstants
import io.ton.walletkit.domain.constants.LogConstants
import io.ton.walletkit.domain.constants.MiscConstants
import io.ton.walletkit.domain.constants.ResponseConstants
import io.ton.walletkit.domain.constants.StorageConstants
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject

/**
 * Secure implementation of WalletKitStorage using Android Keystore and EncryptedSharedPreferences.
 *
 * Security Features:
 * - Mnemonic phrases encrypted with AES-256-GCM using Android Keystore
 * - Hardware-backed encryption when available (StrongBox)
 * - EncryptedSharedPreferences for metadata
 * - Secure memory clearing after sensitive operations
 * - Production-ready implementation
 *
 * Data Protection:
 * - Wallet mnemonics: Double-encrypted (EncryptedSharedPreferences + CryptoManager)
 * - Session hints: EncryptedSharedPreferences
 * - Wallet metadata: EncryptedSharedPreferences
 *
 * @param context Application context
 * @param sharedPrefsName Name for the encrypted SharedPreferences file
 * @suppress This is an internal implementation class.
 */
internal class SecureWalletKitStorage(
    context: Context,
    sharedPrefsName: String = StorageConstants.DEFAULT_SECURE_STORAGE_NAME,
) : WalletKitStorage {
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

    // EncryptedSharedPreferences for storing wallet data
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

    // Additional encryption layer for mnemonics using Android Keystore directly
    private val cryptoManager by lazy {
        CryptoManager(StorageConstants.MNEMONIC_KEYSTORE_KEY)
    }

    private fun walletKey(accountId: String) = StorageConstants.KEY_PREFIX_WALLET + accountId

    override suspend fun saveWallet(
        accountId: String,
        record: StoredWalletRecord,
    ) {
        withContext(Dispatchers.IO) {
            try {
                // Double-encrypt the mnemonic for maximum security
                val encryptedMnemonic = encryptMnemonic(record.mnemonic)

                // Create a record with encrypted mnemonic
                val secureRecord =
                    JSONObject().apply {
                        put(JsonConstants.KEY_MNEMONIC, encryptedMnemonic) // Base64 of encrypted bytes
                        record.name?.let { put(JsonConstants.KEY_NAME, it) }
                        record.network?.let { put(JsonConstants.KEY_NETWORK, it) }
                        record.version?.let { put(JsonConstants.KEY_VERSION, it) }
                    }

                // Store in EncryptedSharedPreferences (second layer of encryption)
                encryptedPrefs.edit {
                    putString(walletKey(accountId), secureRecord.toString())
                }

                Log.d(TAG, ERROR_WALLET_SAVED_SECURELY + accountId)
            } catch (e: Exception) {
                Log.e(TAG, ERROR_FAILED_SAVE_WALLET + accountId, e)
                throw SecurityException(ERROR_FAILED_SAVE_WALLET_SECURELY, e)
            }
        }
    }

    override suspend fun loadWallet(accountId: String): StoredWalletRecord? {
        return withContext(Dispatchers.IO) {
            try {
                val encrypted =
                    encryptedPrefs.getString(walletKey(accountId), null)
                        ?: encryptedPrefs.getString(accountId, null) // Fallback for legacy keys
                        ?: return@withContext null

                val json = JSONObject(encrypted)

                // Decrypt the mnemonic
                val encryptedMnemonic = json.optString(JsonConstants.KEY_MNEMONIC)
                if (encryptedMnemonic.isBlank()) {
                    Log.e(TAG, ERROR_MISSING_MNEMONIC + accountId)
                    return@withContext null
                }

                val mnemonic = decryptMnemonic(encryptedMnemonic)

                StoredWalletRecord(
                    mnemonic = mnemonic,
                    name = json.optString(JsonConstants.KEY_NAME).takeIf { it.isNotBlank() },
                    network = json.optString(JsonConstants.KEY_NETWORK).takeIf { it.isNotBlank() },
                    version = json.optString(JsonConstants.KEY_VERSION).takeIf { it.isNotBlank() },
                )
            } catch (e: Exception) {
                Log.e(TAG, ERROR_FAILED_LOAD_WALLET + accountId, e)
                null
            }
        }
    }

    override suspend fun loadAllWallets(): Map<String, StoredWalletRecord> {
        return withContext(Dispatchers.IO) {
            try {
                encryptedPrefs.all
                    .mapNotNull { (key, _) ->
                        if (!key.startsWith(StorageConstants.KEY_PREFIX_WALLET)) return@mapNotNull null
                        val accountId = key.removePrefix(StorageConstants.KEY_PREFIX_WALLET)
                        val record = loadWallet(accountId)
                        if (record != null) accountId to record else null
                    }
                    .toMap()
            } catch (e: Exception) {
                Log.e(TAG, ERROR_FAILED_LOAD_ALL_WALLETS, e)
                emptyMap()
            }
        }
    }

    override suspend fun clear(accountId: String) {
        withContext(Dispatchers.IO) {
            try {
                encryptedPrefs.edit {
                    remove(walletKey(accountId))
                    remove(accountId) // Remove legacy key if exists
                }
                Log.d(TAG, ERROR_WALLET_CLEARED + accountId)
            } catch (e: Exception) {
                Log.e(TAG, ERROR_FAILED_CLEAR_WALLET + accountId, e)
            }
        }
    }

    // ===== Session Data Methods (with private keys) =====

    private fun sessionKey(sessionId: String) = StorageConstants.KEY_PREFIX_SESSION + sessionId

    override suspend fun saveSessionData(
        sessionId: String,
        session: StoredSessionData,
    ) {
        withContext(Dispatchers.IO) {
            try {
                // Encrypt the private key (CRITICAL security data)
                val encryptedPrivateKey = encryptSessionPrivateKey(session.privateKey)

                // Create JSON with encrypted private key
                val sessionJson =
                    JSONObject().apply {
                        put(ResponseConstants.KEY_SESSION_ID, session.sessionId)
                        put(ResponseConstants.KEY_WALLET_ADDRESS, session.walletAddress)
                        put(ResponseConstants.KEY_CREATED_AT, session.createdAt)
                        put(ResponseConstants.KEY_LAST_ACTIVITY_AT, session.lastActivityAt)
                        put(ResponseConstants.KEY_PRIVATE_KEY, encryptedPrivateKey) // Encrypted
                        put(ResponseConstants.KEY_PUBLIC_KEY, session.publicKey)
                        put(ResponseConstants.KEY_DAPP_NAME, session.dAppName)
                        put(ResponseConstants.KEY_DAPP_DESCRIPTION, session.dAppDescription)
                        put(ResponseConstants.KEY_DOMAIN, sanitizeUrl(session.domain))
                        put(ResponseConstants.KEY_DAPP_ICON_URL, sanitizeUrl(session.dAppIconUrl))
                    }

                // Store in EncryptedSharedPreferences
                encryptedPrefs.edit {
                    putString(sessionKey(sessionId), sessionJson.toString())
                }

                Log.d(
                    TAG,
                    ERROR_SESSION_DATA_SAVED + sessionId + ERROR_SESSION_FOR_DOMAIN + sanitizeUrl(session.domain),
                )
            } catch (e: Exception) {
                Log.e(TAG, ERROR_FAILED_SAVE_SESSION_DATA + sessionId, e)
                throw e
            }
        }
    }

    override suspend fun loadSessionData(sessionId: String): StoredSessionData? = withContext(Dispatchers.IO) {
        try {
            val jsonString = encryptedPrefs.getString(sessionKey(sessionId), null)
            if (jsonString != null) {
                val json = JSONObject(jsonString)
                val encryptedPrivateKey = json.getString(ResponseConstants.KEY_PRIVATE_KEY)
                val decryptedPrivateKey = decryptSessionPrivateKey(encryptedPrivateKey)

                StoredSessionData(
                    sessionId = json.getString(ResponseConstants.KEY_SESSION_ID),
                    walletAddress = json.getString(ResponseConstants.KEY_WALLET_ADDRESS),
                    createdAt = json.getString(ResponseConstants.KEY_CREATED_AT),
                    lastActivityAt = json.getString(ResponseConstants.KEY_LAST_ACTIVITY_AT),
                    privateKey = decryptedPrivateKey,
                    publicKey = json.getString(ResponseConstants.KEY_PUBLIC_KEY),
                    dAppName = json.getString(ResponseConstants.KEY_DAPP_NAME),
                    dAppDescription = json.getString(ResponseConstants.KEY_DAPP_DESCRIPTION),
                    domain = json.getString(ResponseConstants.KEY_DOMAIN),
                    dAppIconUrl = json.getString(ResponseConstants.KEY_DAPP_ICON_URL),
                )
            } else {
                null
            }
        } catch (e: Exception) {
            Log.e(TAG, ERROR_FAILED_LOAD_SESSION_DATA + sessionId, e)
            null
        }
    }

    override suspend fun loadAllSessionData(): Map<String, StoredSessionData> = withContext(Dispatchers.IO) {
        try {
            encryptedPrefs.all
                .mapNotNull { (key, value) ->
                    if (!key.startsWith(StorageConstants.KEY_PREFIX_SESSION)) return@mapNotNull null
                    val sessionId = key.removePrefix(StorageConstants.KEY_PREFIX_SESSION)
                    val sessionData = (value as? String)?.let { jsonString ->
                        try {
                            val json = JSONObject(jsonString)
                            val encryptedPrivateKey = json.getString(ResponseConstants.KEY_PRIVATE_KEY)
                            val decryptedPrivateKey = decryptSessionPrivateKey(encryptedPrivateKey)

                            StoredSessionData(
                                sessionId = json.getString(ResponseConstants.KEY_SESSION_ID),
                                walletAddress = json.getString(ResponseConstants.KEY_WALLET_ADDRESS),
                                createdAt = json.getString(ResponseConstants.KEY_CREATED_AT),
                                lastActivityAt = json.getString(ResponseConstants.KEY_LAST_ACTIVITY_AT),
                                privateKey = decryptedPrivateKey,
                                publicKey = json.getString(ResponseConstants.KEY_PUBLIC_KEY),
                                dAppName = json.getString(ResponseConstants.KEY_DAPP_NAME),
                                dAppDescription = json.getString(ResponseConstants.KEY_DAPP_DESCRIPTION),
                                domain = json.getString(ResponseConstants.KEY_DOMAIN),
                                dAppIconUrl = json.getString(ResponseConstants.KEY_DAPP_ICON_URL),
                            )
                        } catch (e: Exception) {
                            Log.e(TAG, ERROR_FAILED_PARSE_SESSION_DATA + sessionId, e)
                            null
                        }
                    }
                    if (sessionData != null) sessionId to sessionData else null
                }
                .toMap()
        } catch (e: Exception) {
            Log.e(TAG, ERROR_FAILED_LOAD_ALL_SESSION_DATA, e)
            emptyMap()
        }
    }

    override suspend fun clearSessionData(sessionId: String) {
        withContext(Dispatchers.IO) {
            try {
                encryptedPrefs.edit {
                    remove(sessionKey(sessionId))
                }
                Log.d(TAG, ERROR_SESSION_DATA_CLEARED + sessionId)
            } catch (e: Exception) {
                Log.e(TAG, ERROR_FAILED_CLEAR_SESSION_DATA + sessionId, e)
            }
        }
    }

    override suspend fun updateSessionActivity(
        sessionId: String,
        timestamp: String,
    ) {
        withContext(Dispatchers.IO) {
            try {
                // Load existing session
                val session = loadSessionData(sessionId)
                if (session != null) {
                    // Update lastActivityAt
                    val updatedSession = session.copy(lastActivityAt = timestamp)
                    saveSessionData(sessionId, updatedSession)
                    Log.d(TAG, ERROR_SESSION_ACTIVITY_UPDATED + sessionId)
                } else {
                    Log.w(TAG, ERROR_CANNOT_UPDATE_NON_EXISTENT_SESSION + sessionId)
                }
            } catch (e: Exception) {
                Log.e(TAG, ERROR_FAILED_UPDATE_SESSION_ACTIVITY + sessionId, e)
            }
        }
    }

    // ===== Bridge Configuration Methods =====

    private val bridgeConfigKey = StorageConstants.BRIDGE_CONFIG_KEY

    override suspend fun saveBridgeConfig(config: StoredBridgeConfig) {
        withContext(Dispatchers.IO) {
            try {
                // Encrypt API key if present
                val encryptedApiKey = config.apiKey?.let { encryptApiKey(it) }

                val configJson =
                    JSONObject().apply {
                        put(JsonConstants.KEY_NETWORK, config.network)
                        config.tonClientEndpoint?.let { put(ResponseConstants.KEY_TON_CLIENT_ENDPOINT, sanitizeUrl(it)) }
                        config.tonApiUrl?.let { put(JsonConstants.KEY_TON_API_URL, sanitizeUrl(it)) }
                        encryptedApiKey?.let { put(ResponseConstants.KEY_API_KEY, it) }
                        config.bridgeUrl?.let { put(JsonConstants.KEY_BRIDGE_URL, sanitizeUrl(it)) }
                        config.bridgeName?.let { put(JsonConstants.KEY_BRIDGE_NAME, it) }
                    }

                encryptedPrefs.edit {
                    putString(bridgeConfigKey, configJson.toString())
                }
                Log.d(TAG, ERROR_BRIDGE_CONFIG_SAVED + config.network)
            } catch (e: Exception) {
                Log.e(TAG, ERROR_FAILED_SAVE_BRIDGE_CONFIG, e)
                throw e
            }
        }
    }

    override suspend fun loadBridgeConfig(): StoredBridgeConfig? = withContext(Dispatchers.IO) {
        try {
            val jsonString = encryptedPrefs.getString(bridgeConfigKey, null)
            if (jsonString != null) {
                val json = JSONObject(jsonString)
                val encryptedApiKey = json.optString(ResponseConstants.KEY_API_KEY, null)
                val decryptedApiKey = encryptedApiKey?.let { decryptApiKey(it) }

                StoredBridgeConfig(
                    network = json.getString(JsonConstants.KEY_NETWORK),
                    tonClientEndpoint = json.optString(ResponseConstants.KEY_TON_CLIENT_ENDPOINT, null),
                    tonApiUrl = json.optString(JsonConstants.KEY_TON_API_URL, null),
                    apiKey = decryptedApiKey,
                    bridgeUrl = json.optString(JsonConstants.KEY_BRIDGE_URL, null),
                    bridgeName = json.optString(JsonConstants.KEY_BRIDGE_NAME, null),
                )
            } else {
                null
            }
        } catch (e: Exception) {
            Log.e(TAG, ERROR_FAILED_LOAD_BRIDGE_CONFIG, e)
            null
        }
    }

    override suspend fun clearBridgeConfig() {
        withContext(Dispatchers.IO) {
            try {
                encryptedPrefs.edit {
                    remove(bridgeConfigKey)
                }
                Log.d(TAG, ERROR_BRIDGE_CONFIG_CLEARED)
            } catch (e: Exception) {
                Log.e(TAG, ERROR_FAILED_CLEAR_BRIDGE_CONFIG, e)
            }
        }
    }

    // ===== User Preferences Methods =====

    private val userPreferencesKey = StorageConstants.USER_PREFERENCES_KEY

    override suspend fun saveUserPreferences(prefs: StoredUserPreferences) {
        withContext(Dispatchers.IO) {
            try {
                val prefsJson =
                    JSONObject().apply {
                        prefs.activeWalletAddress?.let { put(ResponseConstants.KEY_ACTIVE_WALLET_ADDRESS, it) }
                        prefs.lastSelectedNetwork?.let { put(ResponseConstants.KEY_LAST_SELECTED_NETWORK, it) }
                    }

                encryptedPrefs.edit {
                    putString(userPreferencesKey, prefsJson.toString())
                }
                Log.d(TAG, ERROR_USER_PREFERENCES_SAVED)
            } catch (e: Exception) {
                Log.e(TAG, ERROR_FAILED_SAVE_USER_PREFERENCES, e)
                throw e
            }
        }
    }

    override suspend fun loadUserPreferences(): StoredUserPreferences? = withContext(Dispatchers.IO) {
        try {
            val jsonString = encryptedPrefs.getString(userPreferencesKey, null)
            if (jsonString != null) {
                val json = JSONObject(jsonString)
                StoredUserPreferences(
                    activeWalletAddress = json.optString(ResponseConstants.KEY_ACTIVE_WALLET_ADDRESS, null),
                    lastSelectedNetwork = json.optString(ResponseConstants.KEY_LAST_SELECTED_NETWORK, null),
                )
            } else {
                null
            }
        } catch (e: Exception) {
            Log.e(TAG, ERROR_FAILED_LOAD_USER_PREFERENCES, e)
            null
        }
    }

    override suspend fun clearUserPreferences() {
        withContext(Dispatchers.IO) {
            try {
                encryptedPrefs.edit {
                    remove(userPreferencesKey)
                }
                Log.d(TAG, ERROR_USER_PREFERENCES_CLEARED)
            } catch (e: Exception) {
                Log.e(TAG, ERROR_FAILED_CLEAR_USER_PREFERENCES, e)
            }
        }
    }

    /**
     * Clears all stored data. Use with caution!
     */
    suspend fun clearAll() {
        withContext(Dispatchers.IO) {
            try {
                encryptedPrefs.edit {
                    clear()
                }
                Log.d(TAG, ERROR_ALL_DATA_CLEARED)
            } catch (e: Exception) {
                Log.e(TAG, ERROR_FAILED_CLEAR_ALL_DATA, e)
            }
        }
    }

    /**
     * Encrypts a mnemonic phrase list using Android Keystore.
     * Returns Base64-encoded encrypted data.
     */
    private fun encryptMnemonic(mnemonic: List<String>): String {
        try {
            // Join mnemonic words with space
            val mnemonicString = mnemonic.joinToString(MiscConstants.SPACE_DELIMITER)

            // Encrypt using CryptoManager
            val encryptedBytes = cryptoManager.encrypt(mnemonicString)

            // Encode to Base64 for storage
            return Base64.encodeToString(encryptedBytes, Base64.NO_WRAP)
        } catch (e: Exception) {
            Log.e(TAG, ERROR_FAILED_ENCRYPT_MNEMONIC, e)
            throw SecurityException(ERROR_FAILED_ENCRYPT_MNEMONIC, e)
        }
    }

    /**
     * Decrypts a Base64-encoded encrypted mnemonic.
     * Returns the mnemonic as a list of words.
     */
    private fun decryptMnemonic(encryptedBase64: String): List<String> {
        try {
            // Decode from Base64
            val encryptedBytes = Base64.decode(encryptedBase64, Base64.NO_WRAP)

            // Decrypt using CryptoManager
            val mnemonicString = cryptoManager.decrypt(encryptedBytes)

            // Split into words
            val words = mnemonicString.split(MiscConstants.SPACE_DELIMITER).filter { it.isNotBlank() }

            // Validate mnemonic word count (typically 12 or 24 words)
            if (words.size !in VALID_MNEMONIC_SIZES) {
                Log.w(TAG, ERROR_UNUSUAL_MNEMONIC_WORD_COUNT + words.size)
            }

            return words
        } catch (e: Exception) {
            Log.e(TAG, ERROR_FAILED_DECRYPT_MNEMONIC, e)
            throw SecurityException(ERROR_FAILED_DECRYPT_MNEMONIC, e)
        }
    }

    /**
     * Sanitizes URLs to prevent injection attacks.
     * Only allows http:// and https:// schemes.
     */
    private fun sanitizeUrl(url: String): String {
        val trimmed = url.trim()
        return when {
            trimmed.startsWith(MiscConstants.SCHEME_HTTPS, ignoreCase = true) ||
                trimmed.startsWith(MiscConstants.SCHEME_HTTP, ignoreCase = true) -> trimmed
            else -> {
                Log.w(TAG, ERROR_INVALID_URL_SCHEME_REJECTING + trimmed)
                MiscConstants.EMPTY_STRING
            }
        }
    }

    /**
     * Encrypts a session private key using a separate encryption key.
     * Returns Base64-encoded encrypted data.
     */
    private fun encryptSessionPrivateKey(privateKey: String): String {
        try {
            val sessionCryptoManager = CryptoManager(StorageConstants.SESSION_KEYSTORE_KEY)
            val encryptedBytes = sessionCryptoManager.encrypt(privateKey)
            return Base64.encodeToString(encryptedBytes, Base64.NO_WRAP)
        } catch (e: Exception) {
            Log.e(TAG, ERROR_FAILED_ENCRYPT_SESSION_PRIVATE_KEY, e)
            throw SecurityException(ERROR_FAILED_ENCRYPT_SESSION_PRIVATE_KEY, e)
        }
    }

    /**
     * Decrypts a session private key.
     * Returns the decrypted private key string.
     */
    private fun decryptSessionPrivateKey(encryptedBase64: String): String {
        try {
            val sessionCryptoManager = CryptoManager(StorageConstants.SESSION_KEYSTORE_KEY)
            val encryptedBytes = Base64.decode(encryptedBase64, Base64.NO_WRAP)
            return sessionCryptoManager.decrypt(encryptedBytes)
        } catch (e: Exception) {
            Log.e(TAG, ERROR_FAILED_DECRYPT_SESSION_PRIVATE_KEY, e)
            throw SecurityException(ERROR_FAILED_DECRYPT_SESSION_PRIVATE_KEY, e)
        }
    }

    /**
     * Encrypts an API key using a separate encryption key.
     * Returns Base64-encoded encrypted data.
     */
    private fun encryptApiKey(apiKey: String): String {
        try {
            val apiKeyCryptoManager = CryptoManager(StorageConstants.API_KEY_KEYSTORE_KEY)
            val encryptedBytes = apiKeyCryptoManager.encrypt(apiKey)
            return Base64.encodeToString(encryptedBytes, Base64.NO_WRAP)
        } catch (e: Exception) {
            Log.e(TAG, ERROR_FAILED_ENCRYPT_API_KEY, e)
            throw SecurityException(ERROR_FAILED_ENCRYPT_API_KEY, e)
        }
    }

    /**
     * Decrypts an API key.
     * Returns the decrypted API key string.
     */
    private fun decryptApiKey(encryptedBase64: String): String {
        try {
            val apiKeyCryptoManager = CryptoManager(StorageConstants.API_KEY_KEYSTORE_KEY)
            val encryptedBytes = Base64.decode(encryptedBase64, Base64.NO_WRAP)
            return apiKeyCryptoManager.decrypt(encryptedBytes)
        } catch (e: Exception) {
            Log.e(TAG, ERROR_FAILED_DECRYPT_API_KEY, e)
            throw SecurityException(ERROR_FAILED_DECRYPT_API_KEY, e)
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
     * Clear all bridge-related data from storage (keys starting with "bridge:").
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
        private val VALID_MNEMONIC_SIZES = setOf(12, 15, 18, 21, 24) // BIP39 standard

        // Security / Initialization Errors
        const val ERROR_FAILED_INIT_SECURE_STORAGE = "Failed to initialize secure storage"
        const val ERROR_FAILED_CREATE_MASTER_KEY = "Failed to create MasterKey"
        const val ERROR_FAILED_CREATE_ENCRYPTED_PREFS = "Failed to create EncryptedSharedPreferences"

        // Wallet Operation Errors
        const val ERROR_FAILED_SAVE_WALLET_SECURELY = "Failed to save wallet securely"
        const val ERROR_FAILED_SAVE_WALLET = "Failed to save wallet: "
        const val ERROR_WALLET_SAVED_SECURELY = "Wallet saved securely: "
        const val ERROR_MISSING_MNEMONIC = "Missing mnemonic in stored wallet: "
        const val ERROR_FAILED_LOAD_WALLET = "Failed to load wallet: "
        const val ERROR_FAILED_LOAD_ALL_WALLETS = "Failed to load all wallets"
        const val ERROR_WALLET_CLEARED = "Wallet cleared: "
        const val ERROR_FAILED_CLEAR_WALLET = "Failed to clear wallet: "

        // Session Operation Errors
        const val ERROR_SESSION_DATA_SAVED = "Session data saved: "
        const val ERROR_FAILED_SAVE_SESSION_DATA = "Failed to save session data: "
        const val ERROR_FAILED_LOAD_SESSION_DATA = "Failed to load session data: "
        const val ERROR_FAILED_PARSE_SESSION_DATA = "Failed to parse session data: "
        const val ERROR_FAILED_LOAD_ALL_SESSION_DATA = "Failed to load all session data"
        const val ERROR_SESSION_DATA_CLEARED = "Session data cleared: "
        const val ERROR_FAILED_CLEAR_SESSION_DATA = "Failed to clear session data: "
        const val ERROR_SESSION_ACTIVITY_UPDATED = "Session activity updated: "
        const val ERROR_CANNOT_UPDATE_NON_EXISTENT_SESSION = "Cannot update activity for non-existent session: "
        const val ERROR_FAILED_UPDATE_SESSION_ACTIVITY = "Failed to update session activity: "

        // Config Operation Errors
        const val ERROR_BRIDGE_CONFIG_SAVED = "Bridge config saved for network: "
        const val ERROR_FAILED_SAVE_BRIDGE_CONFIG = "Failed to save bridge config"
        const val ERROR_FAILED_LOAD_BRIDGE_CONFIG = "Failed to load bridge config"
        const val ERROR_BRIDGE_CONFIG_CLEARED = "Bridge config cleared"
        const val ERROR_FAILED_CLEAR_BRIDGE_CONFIG = "Failed to clear bridge config"

        // User Preferences Errors
        const val ERROR_USER_PREFERENCES_SAVED = "User preferences saved"
        const val ERROR_FAILED_SAVE_USER_PREFERENCES = "Failed to save user preferences"
        const val ERROR_FAILED_LOAD_USER_PREFERENCES = "Failed to load user preferences"
        const val ERROR_USER_PREFERENCES_CLEARED = "User preferences cleared"
        const val ERROR_FAILED_CLEAR_USER_PREFERENCES = "Failed to clear user preferences"

        // General Storage Errors
        const val ERROR_ALL_DATA_CLEARED = "All data cleared"
        const val ERROR_FAILED_CLEAR_ALL_DATA = "Failed to clear all data"
        const val ERROR_CLEARED_BRIDGE_STORAGE_KEYS = "Cleared "
        const val ERROR_FAILED_CLEAR_BRIDGE_DATA = "Failed to clear bridge data"
        const val ERROR_FAILED_GET_RAW_VALUE = "Failed to get raw value: "
        const val ERROR_FAILED_SET_RAW_VALUE = "Failed to set raw value: "
        const val ERROR_FAILED_REMOVE_RAW_VALUE = "Failed to remove raw value: "

        // Encryption/Decryption Errors
        const val ERROR_FAILED_ENCRYPT_MNEMONIC = "Failed to encrypt mnemonic"
        const val ERROR_UNUSUAL_MNEMONIC_WORD_COUNT = "Unusual mnemonic word count: "
        const val ERROR_FAILED_DECRYPT_MNEMONIC = "Failed to decrypt mnemonic"
        const val ERROR_FAILED_ENCRYPT_SESSION_PRIVATE_KEY = "Failed to encrypt session private key"
        const val ERROR_FAILED_DECRYPT_SESSION_PRIVATE_KEY = "Failed to decrypt session private key"
        const val ERROR_FAILED_ENCRYPT_API_KEY = "Failed to encrypt API key"
        const val ERROR_FAILED_DECRYPT_API_KEY = "Failed to decrypt API key"

        // URL Validation Errors
        const val ERROR_INVALID_URL_SCHEME_REJECTING = "Invalid URL scheme, rejecting: "
        const val ERROR_SESSION_FOR_DOMAIN = " for domain: "
    }

    // ========================================
    // Pending Events (Automatic Retry)
    // ========================================

    override suspend fun savePendingEvent(event: PendingEvent): Unit = withContext(Dispatchers.IO) {
        try {
            val json = JSONObject().apply {
                put(JsonConstants.KEY_ID, event.id)
                put(JsonConstants.KEY_TYPE, event.type)
                put(JsonConstants.KEY_DATA, event.data)
                put(JsonConstants.KEY_TIMESTAMP, event.timestamp)
                put(JsonConstants.KEY_RETRY_COUNT, event.retryCount)
            }

            val key = "${StorageConstants.KEY_PREFIX_PENDING_EVENT}${event.id}"
            encryptedPrefs.edit {
                putString(key, json.toString())
            }
            Log.d(TAG, "Saved pending event: ${event.id} (type: ${event.type})")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save pending event: ${event.id}", e)
        }
    }

    override suspend fun loadPendingEvent(eventId: String): PendingEvent? = withContext(Dispatchers.IO) {
        try {
            val key = "${StorageConstants.KEY_PREFIX_PENDING_EVENT}$eventId"
            val jsonString = encryptedPrefs.getString(key, null) ?: return@withContext null

            val json = JSONObject(jsonString)
            PendingEvent(
                id = json.getString(JsonConstants.KEY_ID),
                type = json.getString(JsonConstants.KEY_TYPE),
                data = json.getString(JsonConstants.KEY_DATA),
                timestamp = json.getString(JsonConstants.KEY_TIMESTAMP),
                retryCount = json.optInt(JsonConstants.KEY_RETRY_COUNT, 0),
            )
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load pending event: $eventId", e)
            null
        }
    }

    override suspend fun loadAllPendingEvents(): List<PendingEvent> = withContext(Dispatchers.IO) {
        try {
            val events = mutableListOf<PendingEvent>()
            val allKeys = encryptedPrefs.all.keys

            allKeys.forEach { key ->
                if (key.startsWith(StorageConstants.KEY_PREFIX_PENDING_EVENT)) {
                    val jsonString = encryptedPrefs.getString(key, null)
                    if (jsonString != null) {
                        try {
                            val json = JSONObject(jsonString)
                            events.add(
                                PendingEvent(
                                    id = json.getString(JsonConstants.KEY_ID),
                                    type = json.getString(JsonConstants.KEY_TYPE),
                                    data = json.getString(JsonConstants.KEY_DATA),
                                    timestamp = json.getString(JsonConstants.KEY_TIMESTAMP),
                                    retryCount = json.optInt(JsonConstants.KEY_RETRY_COUNT, 0),
                                ),
                            )
                        } catch (e: Exception) {
                            Log.e(TAG, "Failed to parse pending event from key: $key", e)
                        }
                    }
                }
            }

            // Sort by timestamp (oldest first)
            events.sortedBy { it.timestamp }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load all pending events", e)
            emptyList()
        }
    }

    override suspend fun deletePendingEvent(eventId: String): Unit = withContext(Dispatchers.IO) {
        try {
            val key = "${StorageConstants.KEY_PREFIX_PENDING_EVENT}$eventId"
            encryptedPrefs.edit {
                remove(key)
            }
            Log.d(TAG, "Deleted pending event: $eventId")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to delete pending event: $eventId", e)
        }
    }

    override suspend fun clearAllPendingEvents(): Unit = withContext(Dispatchers.IO) {
        try {
            val keysToRemove = encryptedPrefs.all.keys.filter {
                it.startsWith(StorageConstants.KEY_PREFIX_PENDING_EVENT)
            }

            encryptedPrefs.edit {
                keysToRemove.forEach { key ->
                    remove(key)
                }
            }
            Log.d(TAG, "Cleared ${keysToRemove.size} pending events")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to clear all pending events", e)
        }
    }
}
