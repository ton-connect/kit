package io.ton.walletkit.storage.impl

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import io.ton.walletkit.storage.model.StoredBridgeConfig
import io.ton.walletkit.storage.model.StoredSessionData
import io.ton.walletkit.storage.model.StoredUserPreferences
import io.ton.walletkit.storage.model.StoredWalletRecord
import kotlinx.coroutines.test.runTest
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [33])
class WalletKitStorageImplementationsTest {

    private lateinit var context: Context
    private lateinit var debugStorage: DebugSharedPrefsStorage

    @Before
    fun setup() {
        context = ApplicationProvider.getApplicationContext()
        context
            .getSharedPreferences("walletkit-demo", Context.MODE_PRIVATE)
            .edit()
            .clear()
            .commit()
        debugStorage = DebugSharedPrefsStorage(context)
    }

    @Test
    fun `in-memory storage handles wallet and session lifecycle`() = runTest {
        val storage = InMemoryWalletKitStorage()
        val walletId = "memory-wallet"

        val wallet =
            StoredWalletRecord(
                mnemonic = List(12) { "word$it" },
                name = "Memory",
                network = null,
                version = null,
            )

        storage.saveWallet(walletId, wallet)
        assertEquals(wallet, storage.loadWallet(walletId))
        assertEquals(mapOf(walletId to wallet), storage.loadAllWallets())

        val session =
            StoredSessionData(
                sessionId = "session",
                walletAddress = "EQD",
                createdAt = "2023-01-01T00:00:00Z",
                lastActivityAt = "2023-01-01T00:00:00Z",
                privateKey = "deadbeef",
                publicKey = "cafebabe",
                dAppName = "App",
                dAppDescription = "desc",
                domain = "https://example.com",
                dAppIconUrl = "https://example.com/icon.png",
            )

        storage.saveSessionData(session.sessionId, session)
        assertEquals(session, storage.loadSessionData(session.sessionId))

        val updated = "2023-01-02T00:00:00Z"
        storage.updateSessionActivity(session.sessionId, updated)
        assertEquals(updated, storage.loadSessionData(session.sessionId)?.lastActivityAt)

        storage.clearSessionData(session.sessionId)
        assertNull(storage.loadSessionData(session.sessionId))

        storage.clear(walletId)
        assertNull(storage.loadWallet(walletId))
    }

    @Test
    fun `in-memory storage persists config and preferences`() = runTest {
        val storage = InMemoryWalletKitStorage()

        val config =
            StoredBridgeConfig(
                network = "testnet",
                tonClientEndpoint = null,
                tonApiUrl = null,
                apiKey = "key",
                bridgeUrl = "https://bridge",
                bridgeName = null,
            )
        storage.saveBridgeConfig(config)
        assertEquals(config, storage.loadBridgeConfig())

        val prefs = StoredUserPreferences("EQD", "testnet")
        storage.saveUserPreferences(prefs)
        assertEquals(prefs, storage.loadUserPreferences())

        storage.clearBridgeConfig()
        storage.clearUserPreferences()
        assertNull(storage.loadBridgeConfig())
        assertNull(storage.loadUserPreferences())
    }

    @Test
    fun `debug storage handles wallets and sessions`() = runTest {
        val record =
            StoredWalletRecord(
                mnemonic = List(12) { "word$it" },
                name = "Debug wallet",
                network = "testnet",
                version = "v4",
            )

        debugStorage.saveWallet("debug-wallet", record)
        assertEquals(record, debugStorage.loadWallet("debug-wallet"))
        assertEquals(mapOf("debug-wallet" to record), debugStorage.loadAllWallets())

        val session =
            StoredSessionData(
                sessionId = "debug-session",
                walletAddress = "EQDdebug",
                createdAt = "2023-01-01T00:00:00Z",
                lastActivityAt = "2023-01-01T00:00:00Z",
                privateKey = "private",
                publicKey = "public",
                dAppName = "dApp",
                dAppDescription = "desc",
                domain = "https://dapp.example",
                dAppIconUrl = "https://dapp.example/icon.png",
            )

        debugStorage.saveSessionData(session.sessionId, session)
        assertEquals(session, debugStorage.loadSessionData(session.sessionId))
        assertNotNull(debugStorage.loadAllSessionData()[session.sessionId])

        val updated = "2023-02-01T00:00:00Z"
        debugStorage.updateSessionActivity(session.sessionId, updated)
        assertEquals(updated, debugStorage.loadSessionData(session.sessionId)?.lastActivityAt)

        debugStorage.clearSessionData(session.sessionId)
        assertNull(debugStorage.loadSessionData(session.sessionId))
    }

    @Test
    fun `debug storage recovers from malformed session payload`() = runTest {
        val prefs = context.getSharedPreferences("walletkit-demo", Context.MODE_PRIVATE)
        prefs.edit().putString("session:malformed", "{not-json").commit()

        assertNull(debugStorage.loadSessionData("malformed"), "Malformed JSON should return null")
    }

    @Test
    fun `debug storage persists config and preferences`() = runTest {
        val config =
            StoredBridgeConfig(
                network = "mainnet",
                tonClientEndpoint = "https://ton.example",
                tonApiUrl = "https://api.example",
                apiKey = "plain",
                bridgeUrl = null,
                bridgeName = "Bridge",
            )
        debugStorage.saveBridgeConfig(config)
        assertEquals(config, debugStorage.loadBridgeConfig())

        val prefs = StoredUserPreferences(null, "mainnet")
        debugStorage.saveUserPreferences(prefs)
        assertEquals(prefs, debugStorage.loadUserPreferences())

        debugStorage.clearBridgeConfig()
        debugStorage.clearUserPreferences()
        assertNull(debugStorage.loadBridgeConfig())
        assertNull(debugStorage.loadUserPreferences())
    }
}
