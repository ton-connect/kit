package io.ton.walletkit.domain.constants

/**
 * Constants for cryptographic operations and Android KeyStore.
 * Defines algorithm specifications, key sizes, and keystore parameters.
 */
object CryptoConstants {
    // Keystore and Cipher
    const val ANDROID_KEYSTORE = "AndroidKeyStore"
    const val DEFAULT_KEYSTORE_ALIAS = "walletkit_master_key"
    const val CIPHER_TRANSFORMATION = "AES/GCM/NoPadding"

    // Key Sizes
    const val AES_KEY_SIZE = 256
    const val GCM_IV_SIZE = 12 // 96 bits recommended for GCM

    // Log Tags
    const val TAG_CRYPTO_MANAGER = "CryptoManager"
}
