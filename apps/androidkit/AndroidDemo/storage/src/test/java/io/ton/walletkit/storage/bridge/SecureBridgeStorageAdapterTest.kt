package io.ton.walletkit.storage.bridge

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
import kotlin.test.assertNull
import kotlin.test.assertNotNull

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [33], shadows = [ShadowAndroidKeyStore::class])
class SecureBridgeStorageAdapterTest {

    private lateinit var context: Context
    private lateinit var adapter: SecureBridgeStorageAdapter
    private lateinit var storage: SecureWalletKitStorage

    @Before
    fun setup() {
        context = ApplicationProvider.getApplicationContext()
        adapter = SecureBridgeStorageAdapter(context)
        storage = SecureWalletKitStorage(context, "walletkit_bridge_storage")
    }

    @After
    fun teardown() = runTest {
        storage.clearAll()
    }

    @Test
    fun `set and get values round trip`() = runTest {
        adapter.set("wallets", """[{"address":"EQD"}]""")
        adapter.set("sessions", """[{"sessionId":"s1"}]""")

        assertEquals("""[{"address":"EQD"}]""", adapter.get("wallets"))
        assertEquals("""[{"sessionId":"s1"}]""", adapter.get("sessions"))

        // Ensure values are stored with bridge prefix internally
        assertNotNull(storage.getRawValue("bridge:wallets"))
    }

    @Test
    fun `remove clears specific key`() = runTest {
        adapter.set("temp", "value")
        assertNotNull(adapter.get("temp"))

        adapter.remove("temp")
        assertNull(adapter.get("temp"))
    }

    @Test
    fun `clear removes only bridge keys`() = runTest {
        adapter.set("key1", "value1")
        adapter.set("key2", "value2")

        storage.setRawValue("non_bridge", "keep")

        adapter.clear()

        assertNull(adapter.get("key1"))
        assertNull(adapter.get("key2"))
        assertEquals("keep", storage.getRawValue("non_bridge"))
    }

    @Test
    fun `data persists across adapter instances`() = runTest {
        adapter.set("persistent", "data")

        val newAdapter = SecureBridgeStorageAdapter(context)
        assertEquals("data", newAdapter.get("persistent"))
    }
}
