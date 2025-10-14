package io.ton.walletkit.data.storage.encryption

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Log
import io.ton.walletkit.domain.constants.CryptoConstants
import java.nio.ByteBuffer
import java.security.KeyStore
import java.util.Arrays
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/**
 * Manages encryption and decryption of sensitive data using Android Keystore.
 * Uses AES-256-GCM encryption for security and integrity.
 *
 * Key Features:
 * - Hardware-backed encryption when available (StrongBox on supported devices)
 * - AES-256-GCM for authenticated encryption
 * - Unique IV for each encryption operation
 * - Secure memory clearing after use
 */
class CryptoManager(
    private val keystoreAlias: String = DEFAULT_KEYSTORE_ALIAS,
) {
    private val keyStore: KeyStore = KeyStore.getInstance(ANDROID_KEYSTORE).apply {
        load(null)
    }

    init {
        // Ensure encryption key exists
        if (!keyStore.containsAlias(keystoreAlias)) {
            generateKey()
        }
    }

    /**
     * Encrypts the given plaintext data.
     *
     * @param plaintext The data to encrypt
     * @return Encrypted data with IV prepended (IV_SIZE bytes + ciphertext)
     * @throws SecurityException if encryption fails
     */
    fun encrypt(plaintext: String): ByteArray = try {
        val plaintextBytes = plaintext.toByteArray(Charsets.UTF_8)
        val result = encrypt(plaintextBytes)
        // Clear plaintext from memory
        Arrays.fill(plaintextBytes, 0.toByte())
        result
    } catch (e: Exception) {
        Log.e(TAG, ERROR_ENCRYPTION_FAILED, e)
        throw SecurityException(ERROR_FAILED_ENCRYPT_DATA, e)
    }

    /**
     * Encrypts the given plaintext bytes.
     *
     * @param plaintext The bytes to encrypt
     * @return Encrypted data with IV prepended (IV_SIZE bytes + ciphertext)
     */
    fun encrypt(plaintext: ByteArray): ByteArray {
        try {
            val cipher = getCipher()
            val secretKey = getSecretKey()

            // Let AndroidKeyStore generate a fresh IV to satisfy randomized encryption requirement
            cipher.init(Cipher.ENCRYPT_MODE, secretKey)
            val iv = cipher.iv ?: throw IllegalStateException(ERROR_CIPHER_NO_IV)
            if (iv.size != CryptoConstants.GCM_IV_SIZE) {
                throw IllegalStateException(ERROR_UNEXPECTED_IV_SIZE + iv.size)
            }

            // Encrypt the data
            val ciphertext = cipher.doFinal(plaintext)

            // Combine IV + ciphertext
            return ByteBuffer.allocate(GCM_IV_SIZE + ciphertext.size)
                .put(iv)
                .put(ciphertext)
                .array()
        } catch (e: Exception) {
            Log.e(TAG, ERROR_ENCRYPTION_FAILED, e)
            throw SecurityException(ERROR_FAILED_ENCRYPT_DATA, e)
        }
    }

    /**
     * Decrypts the given encrypted data.
     *
     * @param encryptedData The encrypted data with IV prepended
     * @return Decrypted plaintext string
     * @throws SecurityException if decryption fails
     */
    fun decrypt(encryptedData: ByteArray): String = try {
        val plaintextBytes = decryptToBytes(encryptedData)
        val result = String(plaintextBytes, Charsets.UTF_8)
        // Clear plaintext from memory
        Arrays.fill(plaintextBytes, 0.toByte())
        result
    } catch (e: Exception) {
        Log.e(TAG, ERROR_DECRYPTION_FAILED, e)
        throw SecurityException(ERROR_FAILED_DECRYPT_DATA, e)
    }

    /**
     * Decrypts the given encrypted data to bytes.
     *
     * @param encryptedData The encrypted data with IV prepended
     * @return Decrypted plaintext bytes
     */
    fun decryptToBytes(encryptedData: ByteArray): ByteArray {
        try {
            if (encryptedData.size < GCM_IV_SIZE) {
                throw IllegalArgumentException(ERROR_ENCRYPTED_DATA_TOO_SHORT)
            }

            val cipher = getCipher()
            val secretKey = getSecretKey()

            // Extract IV and ciphertext
            val buffer = ByteBuffer.wrap(encryptedData)
            val iv = ByteArray(GCM_IV_SIZE)
            buffer.get(iv)
            val ciphertext = ByteArray(buffer.remaining())
            buffer.get(ciphertext)

            // Initialize cipher for decryption
            val spec = GCMParameterSpec(GCM_TAG_SIZE, iv)
            cipher.init(Cipher.DECRYPT_MODE, secretKey, spec)

            // Decrypt the data
            return cipher.doFinal(ciphertext)
        } catch (e: Exception) {
            Log.e(TAG, ERROR_DECRYPTION_FAILED, e)
            throw SecurityException(ERROR_FAILED_DECRYPT_DATA, e)
        }
    }

    /**
     * Deletes the encryption key from the keystore.
     * WARNING: This will make all encrypted data unrecoverable!
     */
    fun deleteKey() {
        try {
            keyStore.deleteEntry(keystoreAlias)
            Log.d(TAG, ERROR_ENCRYPTION_KEY_DELETED)
        } catch (e: Exception) {
            Log.e(TAG, ERROR_FAILED_DELETE_ENCRYPTION_KEY, e)
        }
    }

    /**
     * Checks if the encryption key exists in the keystore.
     */
    fun hasKey(): Boolean = keyStore.containsAlias(keystoreAlias)

    /**
     * Generates a new AES-256 encryption key in the Android Keystore.
     * Uses hardware-backed storage when available (StrongBox).
     */
    private fun generateKey() {
        try {
            val keyGenerator = KeyGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_AES,
                ANDROID_KEYSTORE,
            )

            val builder = KeyGenParameterSpec.Builder(
                keystoreAlias,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(AES_KEY_SIZE)
                .setRandomizedEncryptionRequired(true)
                .setUserAuthenticationRequired(false) // Can be enabled for additional security

            // Try to use StrongBox (hardware-backed) if available (Android 9+)
            var strongBoxSuccess = false
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
                try {
                    val strongBoxBuilder = KeyGenParameterSpec.Builder(
                        keystoreAlias,
                        KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
                    )
                        .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                        .setKeySize(256)
                        .setIsStrongBoxBacked(true) // Request StrongBox

                    keyGenerator.init(strongBoxBuilder.build())
                    keyGenerator.generateKey()
                    strongBoxSuccess = true
                    Log.d(TAG, ERROR_GENERATED_STRONGBOX_KEY)
                } catch (e: Exception) {
                    // StrongBox not available, fall back to regular keystore
                    Log.d(TAG, ERROR_STRONGBOX_NOT_AVAILABLE, e)
                }
            }

            // Fall back to regular keystore if StrongBox failed or not attempted
            if (!strongBoxSuccess) {
                keyGenerator.init(builder.build()) // Use original builder without StrongBox
                keyGenerator.generateKey()
                Log.d(TAG, ERROR_GENERATED_ENCRYPTION_KEY)
            }
        } catch (e: Exception) {
            Log.e(TAG, ERROR_FAILED_GENERATE_ENCRYPTION_KEY, e)
            throw SecurityException(ERROR_FAILED_GENERATE_ENCRYPTION_KEY, e)
        }
    }

    private fun getSecretKey(): SecretKey {
        val entry = keyStore.getEntry(keystoreAlias, null)
        if (entry !is KeyStore.SecretKeyEntry) {
            throw IllegalStateException(ERROR_KEYSTORE_NOT_SECRET_KEY_ENTRY)
        }
        return entry.secretKey
    }

    private fun getCipher(): Cipher = Cipher.getInstance(CIPHER_TRANSFORMATION)

    companion object {
        private const val TAG = CryptoConstants.TAG_CRYPTO_MANAGER
        private const val ANDROID_KEYSTORE = CryptoConstants.ANDROID_KEYSTORE
        private const val DEFAULT_KEYSTORE_ALIAS = CryptoConstants.DEFAULT_KEYSTORE_ALIAS
        private const val CIPHER_TRANSFORMATION = CryptoConstants.CIPHER_TRANSFORMATION
        private const val AES_KEY_SIZE = CryptoConstants.AES_KEY_SIZE
        private const val GCM_IV_SIZE = CryptoConstants.GCM_IV_SIZE // 96 bits recommended for GCM
        private const val GCM_TAG_SIZE = 128 // 128 bits authentication tag

        /**
         * Securely clears sensitive data from memory.
         * This helps prevent sensitive data from being recovered from memory dumps.
         */
        fun secureClear(data: CharArray) {
            Arrays.fill(data, '\u0000')
        }

        fun secureClear(data: ByteArray) {
            Arrays.fill(data, 0.toByte())
        }

        fun secureClear(data: String?): CharArray {
            val chars = data?.toCharArray() ?: CharArray(0)
            secureClear(chars)
            return chars
        }

        // Encryption/Decryption Errors
        const val ERROR_ENCRYPTION_FAILED = "Encryption failed"
        const val ERROR_FAILED_ENCRYPT_DATA = "Failed to encrypt data"
        const val ERROR_DECRYPTION_FAILED = "Decryption failed"
        const val ERROR_FAILED_DECRYPT_DATA = "Failed to decrypt data"
        const val ERROR_CIPHER_NO_IV = "Cipher did not provide an IV"
        const val ERROR_UNEXPECTED_IV_SIZE = "Unexpected IV size: "
        const val ERROR_ENCRYPTED_DATA_TOO_SHORT = "Encrypted data too short"
        const val ERROR_ENCRYPTION_KEY_DELETED = "Encryption key deleted from keystore"
        const val ERROR_FAILED_DELETE_ENCRYPTION_KEY = "Failed to delete encryption key"
        const val ERROR_GENERATED_STRONGBOX_KEY = "Generated StrongBox-backed encryption key"
        const val ERROR_STRONGBOX_NOT_AVAILABLE = "StrongBox not available, using regular keystore"
        const val ERROR_GENERATED_ENCRYPTION_KEY = "Generated encryption key in Android Keystore"
        const val ERROR_FAILED_GENERATE_ENCRYPTION_KEY = "Failed to generate encryption key"
        const val ERROR_KEYSTORE_NOT_SECRET_KEY_ENTRY = "KeyStore entry is not a SecretKeyEntry"
    }
}
