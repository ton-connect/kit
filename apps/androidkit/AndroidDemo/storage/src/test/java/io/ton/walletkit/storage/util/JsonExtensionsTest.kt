package io.ton.walletkit.storage.util

import io.ton.walletkit.storage.model.StoredSessionHint
import io.ton.walletkit.storage.model.StoredWalletRecord
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [33])
class JsonExtensionsTest {

    @Test
    fun `String toStoredWalletRecord parses valid payload`() {
        val json =
            JSONObject().apply {
                put("words", JSONArray(listOf("one", "two", "three")))
                put("name", "Main wallet")
                put("network", "testnet")
                put("version", "v4R2")
            }

        val record = json.toString().toStoredWalletRecord()
        requireNotNull(record)

        assertEquals(listOf("one", "two", "three"), record.mnemonic)
        assertEquals("Main wallet", record.name)
        assertEquals("testnet", record.network)
        assertEquals("v4R2", record.version)
    }

    @Test
    fun `String toStoredWalletRecord returns null when words missing`() {
        val json =
            JSONObject().apply {
                put("name", "Missing words")
            }

        assertNull(json.toString().toStoredWalletRecord(), "Missing words array should return null")
    }

    @Test
    fun `StoredWalletRecord toJson round trips optional fields`() {
        val record = StoredWalletRecord(
            mnemonic = listOf("alpha", "beta"),
            name = null,
            network = "mainnet",
            version = null,
        )

        val json = record.toJson()

        val words = json.getJSONArray("words")
        assertEquals("alpha", words.getString(0))
        assertEquals("beta", words.getString(1))
        assertFalse(json.has("name"), "Null name should not be present")
        assertEquals("mainnet", json.getString("network"))
        assertFalse(json.has("version"), "Null version should not be present")
    }

    @Test
    fun `StoredSessionHint toJson omits nulls`() {
        val hint = StoredSessionHint(
            manifestUrl = "https://example.com/manifest.json",
            dAppUrl = null,
            iconUrl = "https://example.com/icon.png",
        )

        val json = hint.toJson()
        assertEquals("https://example.com/manifest.json", json.getString("manifestUrl"))
        assertFalse(json.has("dAppUrl"), "Null dAppUrl should be omitted")
        assertEquals("https://example.com/icon.png", json.getString("iconUrl"))
    }

    @Test
    fun `stringOrNull returns null for JSONObject null`() {
        val json =
            JSONObject().apply {
                put("value", JSONObject.NULL)
            }

        assertNull(json.stringOrNull("value"), "JSONObject NULL should map to Kotlin null")
    }
}
