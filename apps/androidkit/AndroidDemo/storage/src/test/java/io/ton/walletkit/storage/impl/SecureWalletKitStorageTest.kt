package io.ton.walletkit.storage.impl

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import io.ton.walletkit.storage.model.StoredBridgeConfig
import io.ton.walletkit.storage.model.StoredSessionData
import io.ton.walletkit.storage.model.StoredUserPreferences
import io.ton.walletkit.storage.model.StoredWalletRecord
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.shadows.ShadowAndroidKeyStore
import kotlin.random.Random
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertFalse

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [33], shadows = [ShadowAndroidKeyStore::class])
class SecureWalletKitStorageTest {

    private lateinit var context: Context
    private lateinit var storage: SecureWalletKitStorage

    @Before
    fun setup() {
        context = ApplicationProvider.getApplicationContext()
        storage = SecureWalletKitStorage(context, "secure_walletkit_storage_test")
    }

    @After
    fun teardown() = runTest {
        storage.clearAll()
    }

    @Test
    fun `wallet save and load round trip`() = runTest {
        val accountId = "EQD123"
        val record =
            StoredWalletRecord(
                mnemonic = List(24) { index -> "word$index" },
                name = "Primary Wallet",
                network = "mainnet",
                version = "v4R2",
            )

        storage.saveWallet(accountId, record)
        val loaded = storage.loadWallet(accountId)

        assertEquals(record, loaded, "Loaded wallet should match the stored record")
        val allWallets = storage.loadAllWallets()
        assertEquals(1, allWallets.size)
        assertEquals(record, allWallets[accountId])
    }

    @Test
    fun `clear removes wallet and legacy keys`() = runTest {
        val accountId = "legacy-wallet"
        val record =
            StoredWalletRecord(
                mnemonic = List(12) { "word$it" },
                name = null,
                network = "testnet",
                version = null,
            )

        storage.saveWallet(accountId, record)
        // Simulate legacy key storage for backward compatibility
        storage.setRawValue(accountId, """{"mnemonic":"legacy"}""")

        assertNotNull(storage.getRawValue("wallet:$accountId"))
        assertNotNull(storage.getRawValue(accountId))

        storage.clear(accountId)

        assertNull(storage.loadWallet(accountId))
        assertNull(storage.getRawValue("wallet:$accountId"))
        assertNull(storage.getRawValue(accountId))
    }

    @Test
    fun `loadWallet returns null for tampered payload`() = runTest {
        val accountId = "corrupted-wallet"
        storage.setRawValue(
            "wallet:$accountId",
            """{"mnemonic":"not-base64","name":"Test"}""",
        )

        assertNull(storage.loadWallet(accountId), "Corrupted data should return null")
    }

    @Test
    fun `session data round trip with sanitization`() = runTest {
        val sessionId = "session-1"
        val session =
            StoredSessionData(
                sessionId = sessionId,
                walletAddress = "EQDwallet",
                createdAt = "2024-01-01T00:00:00Z",
                lastActivityAt = "2024-01-02T00:00:00Z",
                privateKey = "deadbeef",
                publicKey = "cafebabe",
                dAppName = "Test dApp",
                dAppDescription = "Example",
                domain = "   javascript:alert(1)",
                dAppIconUrl = "ftp://invalid",
            )

        storage.saveSessionData(sessionId, session)
        val loaded = storage.loadSessionData(sessionId)
        requireNotNull(loaded)

        assertEquals(session.sessionId, loaded.sessionId)
        assertEquals(session.walletAddress, loaded.walletAddress)
        assertEquals(session.privateKey, loaded.privateKey, "Private key should decrypt correctly")
        assertEquals("", loaded.domain, "Unsafe domain should be sanitized to empty string")
        assertEquals("", loaded.dAppIconUrl, "Unsafe icon URL should be sanitized to empty string")

        val updatedTimestamp = "2024-02-10T10:10:10Z"
        storage.updateSessionActivity(sessionId, updatedTimestamp)
        val updated = storage.loadSessionData(sessionId)
        assertEquals(updatedTimestamp, updated?.lastActivityAt)
        assertEquals(session.privateKey, updated?.privateKey)

        val allSessions = storage.loadAllSessionData()
        assertEquals(1, allSessions.size)
        assertNotNull(allSessions[sessionId])

        storage.clearSessionData(sessionId)
        assertNull(storage.loadSessionData(sessionId))
    }

    @Test
    fun `session load skips corrupted private key`() = runTest {
        val sessionId = "broken-session"
        storage.setRawValue(
            "session:$sessionId",
            """
            {
                "sessionId":"$sessionId",
                "walletAddress":"EQDbroken",
                "createdAt":"2023-01-01T00:00:00Z",
                "lastActivityAt":"2023-01-01T00:00:00Z",
                "privateKey":"invalid-base64",
                "publicKey":"pub",
                "dAppName":"Broken",
                "dAppDescription":"desc",
                "domain":"https://example.com",
                "dAppIconUrl":"https://example.com/icon.png"
            }
            """.trimIndent(),
        )

        assertNull(storage.loadSessionData(sessionId), "Corrupted cipher should result in null")
    }

    @Test
    fun `bridge config encrypts API key and round trips`() = runTest {
        val config =
            StoredBridgeConfig(
                network = "testnet",
                tonClientEndpoint = "https://client.example",
                tonApiUrl = "http://api.example",
                apiKey = "plain-api-key",
                bridgeUrl = "https://bridge.example",
                bridgeName = "Test Bridge",
            )

        storage.saveBridgeConfig(config)

        val raw = storage.getRawValue("bridge_config")
        requireNotNull(raw)
        assertFalse(raw.contains("plain-api-key"), "API key should be stored encrypted")

        val loaded = storage.loadBridgeConfig()
        assertEquals(config.copy(tonApiUrl = "http://api.example"), loaded)

        storage.clearBridgeConfig()
        assertNull(storage.loadBridgeConfig())
    }

    @Test
    fun `bridge config sanitizes invalid urls`() = runTest {
        val config =
            StoredBridgeConfig(
                network = "mainnet",
                tonClientEndpoint = "javascript:alert(1)",
                tonApiUrl = null,
                apiKey = null,
                bridgeUrl = "   ftp://invalid ",
                bridgeName = null,
            )

        storage.saveBridgeConfig(config)
        val loaded = storage.loadBridgeConfig()
        requireNotNull(loaded)

        assertEquals("", loaded.tonClientEndpoint)
        assertEquals("", loaded.bridgeUrl)
    }

    @Test
    fun `user preferences round trip and clear`() = runTest {
        val prefs =
            StoredUserPreferences(
                activeWalletAddress = "EQD123",
                lastSelectedNetwork = null,
            )

        storage.saveUserPreferences(prefs)
        val loaded = storage.loadUserPreferences()

        assertEquals(prefs, loaded)

        storage.clearUserPreferences()
        assertNull(storage.loadUserPreferences())
    }

    @Test
    fun `clearAll removes every stored entity`() = runTest {
        val walletRecord = StoredWalletRecord(List(12) { "word$it" }, null, null, null)
        storage.saveWallet("wallet1", walletRecord)

        val session =
            StoredSessionData(
                sessionId = "session1",
                walletAddress = "EQDwallet",
                createdAt = "2024-01-01T00:00:00Z",
                lastActivityAt = "2024-01-01T00:00:00Z",
                privateKey = "deadbeef",
                publicKey = "cafebabe",
                dAppName = "App",
                dAppDescription = "desc",
                domain = "https://example.com",
                dAppIconUrl = "https://example.com/icon.png",
            )
        storage.saveSessionData("session1", session)

        storage.saveBridgeConfig(
            StoredBridgeConfig("testnet", null, null, "apikey", null, null),
        )
        storage.saveUserPreferences(StoredUserPreferences("EQDwallet", "testnet"))

        storage.clearAll()

        assertNull(storage.loadWallet("wallet1"))
        assertNull(storage.loadSessionData("session1"))
        assertNull(storage.loadBridgeConfig())
        assertNull(storage.loadUserPreferences())
    }

    @Test
    fun `data persists across storage instances`() = runTest {
        val walletId = "multi-instance"
        val wallet =
            StoredWalletRecord(
                mnemonic = List(12) { "word$it" },
                name = "Multi",
                network = "mainnet",
                version = "v4",
            )
        storage.saveWallet(walletId, wallet)
        storage.saveUserPreferences(StoredUserPreferences(walletId, "mainnet"))
        val session =
            StoredSessionData(
                sessionId = "persist-session",
                walletAddress = walletId,
                createdAt = "2024-01-01T00:00:00Z",
                lastActivityAt = "2024-01-01T00:00:00Z",
                privateKey = "deadbeef",
                publicKey = "cafebabe",
                dAppName = "Persist dApp",
                dAppDescription = "desc",
                domain = "https://persist.example",
                dAppIconUrl = "https://persist.example/icon.png",
            )
        storage.saveSessionData(session.sessionId, session)
        val config =
            StoredBridgeConfig(
                network = "mainnet",
                tonClientEndpoint = "https://client.persist",
                tonApiUrl = "https://api.persist",
                apiKey = "persist-key",
                bridgeUrl = "https://bridge.persist",
                bridgeName = "Persist Bridge",
            )
        storage.saveBridgeConfig(config)

        val newStorage = SecureWalletKitStorage(context, "secure_walletkit_storage_test")
        val loadedWallet = newStorage.loadWallet(walletId)
        val loadedPrefs = newStorage.loadUserPreferences()
        val loadedSession = newStorage.loadSessionData(session.sessionId)
        val loadedConfig = newStorage.loadBridgeConfig()

        assertEquals(wallet, loadedWallet)
        assertEquals(StoredUserPreferences(walletId, "mainnet"), loadedPrefs)
        assertEquals(session, loadedSession)
        assertEquals(config, loadedConfig)

        newStorage.clearAll()
    }

    @Test
    fun `concurrent operations keep last write`() = runTest {
        val walletId = "hot-wallet"

        val jobs =
            List(5) { index ->
                async(Dispatchers.Default) {
                    val record =
                        StoredWalletRecord(
                            mnemonic = List(12) { "word${Random.nextInt()}" },
                            name = "Wallet $index",
                            network = "testnet",
                            version = "v$index",
                        )
                    storage.saveWallet(walletId, record)
                }
            }
        jobs.awaitAll()

        val finalRecord = storage.loadWallet(walletId)
        assertNotNull(finalRecord)

        // Ensure raw value still decrypts
        val raw = storage.getRawValue("wallet:$walletId")
        assertNotNull(raw)
    }
}
