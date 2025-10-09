package io.ton.walletkit.storage.encryption

import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.shadows.ShadowAndroidKeyStore
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotEquals
import kotlin.test.assertTrue
import kotlin.test.assertFailsWith

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [33], shadows = [ShadowAndroidKeyStore::class])
class CryptoManagerTest {

    private lateinit var alias: String
    private lateinit var cryptoManager: CryptoManager

    @Before
    fun setUp() {
        alias = "walletkit_crypto_test_${UUID.randomUUID()}"
        cryptoManager = CryptoManager(alias)
    }

    @After
    fun tearDown() {
        // Ensure the key is removed so aliases do not leak across tests
        runCatching { cryptoManager.deleteKey() }
    }

    @Test
    fun `encrypt and decrypt string payload`() {
        val plaintext = "Sensitive data 123 🚀 世界"

        val encrypted = cryptoManager.encrypt(plaintext)
        assertTrue(encrypted.isNotEmpty(), "Encrypted payload should not be empty")
        assertNotEquals(
            plaintext,
            encrypted.decodeToString(),
            "Encrypted payload must not expose plaintext",
        )

        val decrypted = cryptoManager.decrypt(encrypted)
        assertEquals(plaintext, decrypted, "Decrypt should return original plaintext")
    }

    @Test
    fun `encrypt produces unique ciphertext for identical plaintext`() {
        val plaintext = "repeatable text"

        val first = cryptoManager.encrypt(plaintext)
        val second = cryptoManager.encrypt(plaintext)

        assertFalse(first.contentEquals(second), "Randomized IV should produce different ciphertext")
    }

    @Test
    fun `decrypt fails for tampered payload`() {
        val encrypted = cryptoManager.encrypt("secret")
        val tampered = encrypted.copyOf()
        tampered[tampered.lastIndex] = tampered.last().inc()

        assertFailsWith<SecurityException>("Tampered data must not decrypt successfully") {
            cryptoManager.decrypt(tampered)
        }
    }

    @Test
    fun `decrypt fails for truncated payload`() {
        val truncated = ByteArray(2) { 0 }

        assertFailsWith<SecurityException>("Truncated payload should be rejected") {
            cryptoManager.decrypt(truncated)
        }
    }

    @Test
    fun `deleteKey removes alias and new instance recreates key`() {
        assertTrue(cryptoManager.hasKey(), "Key should exist after initialization")

        cryptoManager.deleteKey()
        assertFalse(cryptoManager.hasKey(), "Key should be removed after deleteKey")

        val recreated = CryptoManager(alias)
        try {
            assertTrue(recreated.hasKey(), "New instance should regenerate missing key")
        } finally {
            runCatching { recreated.deleteKey() }
        }
    }

    @Test
    fun `secureClear zeroes byte and char arrays`() {
        val bytes = byteArrayOf(1, 2, 3, 4)
        CryptoManager.secureClear(bytes)
        assertTrue(bytes.all { it == 0.toByte() }, "secureClear should zero byte array")

        val chars = charArrayOf('a', 'b', 'c')
        CryptoManager.secureClear(chars)
        assertTrue(chars.all { it == '\u0000' }, "secureClear should zero char array")

        val cleared = CryptoManager.secureClear("ephemeral")
        assertTrue(cleared.all { it == '\u0000' }, "secureClear should clear returned char array")
    }
}
