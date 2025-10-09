package io.ton.walletkit.storage

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import io.ton.walletkit.storage.impl.SecureWalletKitStorage
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.shadows.ShadowAndroidKeyStore
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull

/**
 * Unit tests for SecureWalletKitStorage raw key-value methods.
 *
 * These methods are used by SecureBridgeStorageAdapter to provide
 * storage for the bridge module.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [33], shadows = [ShadowAndroidKeyStore::class])
class SecureWalletKitStorageRawMethodsTest {

    private lateinit var context: Context
    private lateinit var storage: SecureWalletKitStorage

    @Before
    fun setup() {
        context = ApplicationProvider.getApplicationContext()
        storage = SecureWalletKitStorage(context, "test_storage")
    }

    @After
    fun tearDown() = runTest {
        // Clean up bridge data
        storage.clearBridgeData()
    }

    @Test
    fun `getRawValue returns null for non-existent key`() = runTest {
        val result = storage.getRawValue("non_existent_key")
        assertNull(result, "Non-existent key should return null")
    }

    @Test
    fun `setRawValue and getRawValue round-trip works`() = runTest {
        val key = "bridge:test_key"
        val value = "test_value"

        storage.setRawValue(key, value)
        val retrieved = storage.getRawValue(key)

        assertEquals(value, retrieved, "Retrieved value should match stored value")
    }

    @Test
    fun `setRawValue stores JSON data correctly`() = runTest {
        val key = "bridge:wallets"
        val jsonValue = """[{"address":"EQD...","publicKey":"abc123"}]"""

        storage.setRawValue(key, jsonValue)
        val retrieved = storage.getRawValue(key)

        assertEquals(jsonValue, retrieved, "JSON data should be stored correctly")
    }

    @Test
    fun `setRawValue overwrites existing value`() = runTest {
        val key = "bridge:overwrite_test"
        val value1 = "first_value"
        val value2 = "second_value"

        storage.setRawValue(key, value1)
        storage.setRawValue(key, value2)
        val retrieved = storage.getRawValue(key)

        assertEquals(value2, retrieved, "Value should be overwritten")
    }

    @Test
    fun `removeRawValue deletes key`() = runTest {
        val key = "bridge:remove_test"
        val value = "value_to_remove"

        storage.setRawValue(key, value)
        assertNotNull(storage.getRawValue(key), "Value should exist before removal")

        storage.removeRawValue(key)
        assertNull(storage.getRawValue(key), "Value should be null after removal")
    }

    @Test
    fun `removeRawValue on non-existent key does not throw`() = runTest {
        // Should not throw an exception
        storage.removeRawValue("non_existent_key")
    }

    @Test
    fun `clearBridgeData removes only bridge keys`() = runTest {
        // Add bridge keys
        storage.setRawValue("bridge:key1", "value1")
        storage.setRawValue("bridge:key2", "value2")
        storage.setRawValue("bridge:sessions", "session_data")

        // Add non-bridge key (simulating other storage usage)
        storage.setRawValue("other:key", "other_value")

        // Verify all exist
        assertNotNull(storage.getRawValue("bridge:key1"))
        assertNotNull(storage.getRawValue("bridge:key2"))
        assertNotNull(storage.getRawValue("bridge:sessions"))
        assertNotNull(storage.getRawValue("other:key"))

        // Clear only bridge data
        storage.clearBridgeData()

        // Verify bridge keys are gone
        assertNull(storage.getRawValue("bridge:key1"))
        assertNull(storage.getRawValue("bridge:key2"))
        assertNull(storage.getRawValue("bridge:sessions"))

        // Verify non-bridge key still exists
        assertEquals("other_value", storage.getRawValue("other:key"))

        // Cleanup
        storage.removeRawValue("other:key")
    }

    @Test
    fun `handles empty string value`() = runTest {
        val key = "bridge:empty_string"
        val value = ""

        storage.setRawValue(key, value)
        val retrieved = storage.getRawValue(key)

        assertEquals(value, retrieved, "Empty string should be handled")
    }

    @Test
    fun `handles large value`() = runTest {
        val key = "bridge:large_value"
        val value = "x".repeat(50000) // 50KB of data

        storage.setRawValue(key, value)
        val retrieved = storage.getRawValue(key)

        assertEquals(value, retrieved, "Large value should be handled")
    }

    @Test
    fun `handles unicode characters`() = runTest {
        val key = "bridge:unicode_test"
        val value = "Hello 世界 🚀 مرحبا Привет"

        storage.setRawValue(key, value)
        val retrieved = storage.getRawValue(key)

        assertEquals(value, retrieved, "Unicode should be handled correctly")
    }

    @Test
    fun `handles complex JSON structure`() = runTest {
        val key = "bridge:complex_json"
        val value = """
            {
                "wallets": [
                    {"address": "EQD1", "publicKey": "pk1", "version": "v4R2"},
                    {"address": "EQD2", "publicKey": "pk2", "version": "v4R2"}
                ],
                "sessions": [
                    {
                        "sessionId": "abc123",
                        "dAppName": "Test dApp",
                        "walletAddress": "EQD1",
                        "privateKey": "sk1"
                    }
                ],
                "config": {
                    "network": "testnet",
                    "activeWallet": "EQD1"
                }
            }
        """.trimIndent()

        storage.setRawValue(key, value)
        val retrieved = storage.getRawValue(key)

        assertEquals(value, retrieved, "Complex JSON should be handled")
    }

    @Test
    fun `data persists across storage instances`() = runTest {
        val key = "bridge:persistence_test"
        val value = "persistent_value"

        // Store with first instance
        storage.setRawValue(key, value)

        // Create new instance (same prefs name)
        val newStorage = SecureWalletKitStorage(context, "test_storage")
        val retrieved = newStorage.getRawValue(key)

        assertEquals(value, retrieved, "Data should persist across instances")

        // Cleanup
        newStorage.clearBridgeData()
    }

    @Test
    fun `multiple operations maintain data integrity`() = runTest {
        // Simulate realistic bridge usage
        storage.setRawValue("bridge:wallets", """[{"address":"EQD1"}]""")
        storage.setRawValue("bridge:sessions", """[{"sessionId":"s1"}]""")
        storage.setRawValue("bridge:config", """{"network":"testnet"}""")

        // Verify all exist
        assertNotNull(storage.getRawValue("bridge:wallets"))
        assertNotNull(storage.getRawValue("bridge:sessions"))
        assertNotNull(storage.getRawValue("bridge:config"))

        // Update one
        storage.setRawValue("bridge:wallets", """[{"address":"EQD1"},{"address":"EQD2"}]""")

        // Verify others unchanged
        assertEquals("""[{"sessionId":"s1"}]""", storage.getRawValue("bridge:sessions"))
        assertEquals("""{"network":"testnet"}""", storage.getRawValue("bridge:config"))

        // Verify updated one
        assertEquals(
            """[{"address":"EQD1"},{"address":"EQD2"}]""",
            storage.getRawValue("bridge:wallets"),
        )
    }

    @Test
    fun `concurrent operations handle correctly`() = runTest {
        val key = "bridge:concurrent_test"

        // Simulate rapid updates
        storage.setRawValue(key, "value1")
        storage.setRawValue(key, "value2")
        storage.setRawValue(key, "value3")
        storage.setRawValue(key, "value4")
        storage.setRawValue(key, "value5")

        // Should have the last value
        assertEquals("value5", storage.getRawValue(key))
    }
}
