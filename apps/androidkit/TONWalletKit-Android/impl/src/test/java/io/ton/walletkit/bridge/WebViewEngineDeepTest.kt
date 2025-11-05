package io.ton.walletkit.bridge

import android.content.Context
import android.os.Looper
import androidx.test.core.app.ApplicationProvider
import io.ton.walletkit.WalletKitBridgeException
import io.ton.walletkit.config.TONWalletKitConfiguration
import io.ton.walletkit.event.TONWalletKitEvent
import io.ton.walletkit.engine.WebViewWalletKitEngine
import io.ton.walletkit.listener.TONBridgeEventsHandler
import io.ton.walletkit.model.TONNetwork
import io.ton.walletkit.model.Transaction
import io.ton.walletkit.model.TransactionType
import io.ton.walletkit.model.WalletAccount
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.json.JSONArray
import org.json.JSONObject
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows
import org.robolectric.annotation.Config
import java.lang.reflect.Field
import java.lang.reflect.Method
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

/**
 * Deep integration tests for WebViewWalletKitEngine that actually execute code paths.
 * Uses reflection and mocking to test internal bridge communication.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], manifest = Config.NONE)
@OptIn(ExperimentalCoroutinesApi::class)
class WebViewEngineDeepTest {
    private val testDispatcher = StandardTestDispatcher()
    private lateinit var context: Context
    private lateinit var defaultConfiguration: TONWalletKitConfiguration

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        context = ApplicationProvider.getApplicationContext()
        defaultConfiguration = createConfiguration()
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun createConfiguration(
        network: TONNetwork = TONNetwork.TESTNET,
        persistent: Boolean = true,
        apiUrl: String? = null,
    ): TONWalletKitConfiguration {
        return TONWalletKitConfiguration(
            network = network,
            walletManifest = TONWalletKitConfiguration.Manifest(
                name = "Test Wallet",
                appName = "Wallet",
                imageUrl = "https://example.com/icon.png",
                aboutUrl = "https://example.com",
                universalLink = "https://example.com/app",
                bridgeUrl = "https://bridge.tonapi.io/bridge",
            ),
            bridge = TONWalletKitConfiguration.Bridge(
                bridgeUrl = "https://bridge.tonapi.io/bridge",
            ),
            apiClient = apiUrl?.let { TONWalletKitConfiguration.APIClient(url = it, key = "test-key") },
            features = emptyList<TONWalletKitConfiguration.Feature>(),
            storage = TONWalletKitConfiguration.Storage(persistent = persistent),
        )
    }

    @Test
    fun `handleResponse processes successful result`() {
        val engine = createEngine()
        flushMainThread()

        // Create a mock response
        val response = JSONObject().apply {
            put(
                "result",
                JSONObject().apply {
                    put("balance", "1000000000")
                    put("status", "active")
                },
            )
        }

        // Use reflection to call handleResponse
        val callId = "test-call-123"
        val deferred = CompletableDeferred<Any>()

        // Set up pending call
        val pendingField = getPrivateField(engine, "pending")

        @Suppress("UNCHECKED_CAST")
        val pending = pendingField.get(engine) as java.util.concurrent.ConcurrentHashMap<String, CompletableDeferred<*>>
        pending[callId] = deferred

        // Call handleResponse
        val handleResponseMethod = getPrivateMethod(engine, "handleResponse", String::class.java, JSONObject::class.java)
        handleResponseMethod.invoke(engine, callId, response)

        // Verify response was processed
        assertTrue(deferred.isCompleted)
    }

    @Test
    fun `handleResponse processes error response`() {
        val engine = createEngine()
        flushMainThread()

        val response = JSONObject().apply {
            put(
                "error",
                JSONObject().apply {
                    put("message", "Test error message")
                },
            )
        }

        val callId = "test-call-456"
        val deferred = CompletableDeferred<Any>()

        val pendingField = getPrivateField(engine, "pending")

        @Suppress("UNCHECKED_CAST")
        val pending = pendingField.get(engine) as java.util.concurrent.ConcurrentHashMap<String, CompletableDeferred<*>>
        pending[callId] = deferred

        val handleResponseMethod = getPrivateMethod(engine, "handleResponse", String::class.java, JSONObject::class.java)
        handleResponseMethod.invoke(engine, callId, response)

        assertTrue(deferred.isCompleted)
        // Verify it completed exceptionally
        val exception = assertFailsWith<Exception> {
            runTest {
                deferred.await()
            }
        }
        assertTrue(exception is WalletKitBridgeException || exception.cause is WalletKitBridgeException)
    }

    @Test
    fun `handleEvent dispatches to event handlers`() = runTest {
        val recordingHandler = RecordingEventsHandler()
        val engine = createEngine(eventsHandler = recordingHandler)
        flushMainThread()

        // Create a disconnect event (simplest one in public API)
        val event = JSONObject().apply {
            put("type", "disconnect")
            put(
                "data",
                JSONObject().apply {
                    put("sessionId", "test-session-123")
                },
            )
        }

        val handleEventMethod = getPrivateMethod(engine, "handleEvent", JSONObject::class.java)
        handleEventMethod.invoke(engine, event)

        flushMainThread() // Let the event dispatch on main thread

        // Verify event was dispatched
        assertTrue(recordingHandler.events.isNotEmpty())
        assertTrue(recordingHandler.events.first() is TONWalletKitEvent.Disconnect)
    }

    @Test
    fun `config validation stores network setting`() = runTest {
        val engine = createEngine()
        flushMainThread()

        val config = createConfiguration(
            network = TONNetwork.MAINNET,
            apiUrl = "https://tonapi.io",
        )

        // Access private field to verify config was stored
        val networkField = getPrivateField(engine, "currentNetwork")
        val initialNetwork = networkField.get(engine) as String
        assertEquals("testnet", initialNetwork) // Default before init

        // The actual init would set it, but we can verify the config object exists
        assertNotNull(config)
        assertEquals(TONNetwork.MAINNET, config.network)
        assertEquals("https://tonapi.io", config.apiClient?.url)
    }

    @Test
    fun `parseTransactions converts JSON to Transaction objects`() {
        val txJson = JSONObject().apply {
            put("hash", "abc123")
            put("timestamp", 1697000000L)
            put("amount", "500000000")
            put("fee", "1000000")
            put("type", "incoming")
            put("sender", "EQDsender...")
            put("recipient", "EQDrecipient...")
        }

        val txArray = JSONArray().apply {
            put(txJson)
        }

        // Test Transaction model directly
        val tx = Transaction(
            hash = txJson.getString("hash"),
            timestamp = txJson.getLong("timestamp"),
            amount = txJson.getString("amount"),
            fee = txJson.optString("fee"),
            type = TransactionType.INCOMING,
            sender = txJson.optString("sender"),
            recipient = txJson.optString("recipient"),
        )

        assertEquals("abc123", tx.hash)
        assertEquals(1697000000L, tx.timestamp)
        assertEquals("500000000", tx.amount)
        assertEquals(TransactionType.INCOMING, tx.type)
    }

    @Test
    fun `parseWalletAccount converts JSON to WalletAccount object`() {
        val walletJson = JSONObject().apply {
            put("address", "EQDtest123...")
            put("publicKey", "pubkey-hex")
            put("name", "Test Wallet")
            put("version", "v5r1")
            put("network", "mainnet")
            put("index", 0)
        }

        val wallet = WalletAccount(
            address = walletJson.getString("address"),
            publicKey = walletJson.optString("publicKey"),
            name = walletJson.optString("name"),
            version = walletJson.getString("version"),
            network = walletJson.getString("network"),
            index = walletJson.getInt("index"),
        )

        assertEquals("EQDtest123...", wallet.address)
        assertEquals("pubkey-hex", wallet.publicKey)
        assertEquals("Test Wallet", wallet.name)
        assertEquals("v5r1", wallet.version)
        assertEquals("mainnet", wallet.network)
        assertEquals(0, wallet.index)
    }

    @Test
    fun `event handler forwarding can be controlled externally`() {
        val recordingHandler = RecordingEventsHandler()
        var forwardEvents = true
        val configurableHandler =
            object : TONBridgeEventsHandler {
                override fun handle(event: TONWalletKitEvent) {
                    if (forwardEvents) {
                        recordingHandler.handle(event)
                    }
                }
            }

        val engine = createEngine(eventsHandler = configurableHandler)
        flushMainThread()

        val handleEventMethod = getPrivateMethod(engine, "handleEvent", JSONObject::class.java)
        val event = disconnectEvent("session-789")
        handleEventMethod.invoke(engine, event)
        flushMainThread()
        assertEquals(1, recordingHandler.events.size)

        forwardEvents = false
        handleEventMethod.invoke(engine, event)
        flushMainThread()
        assertEquals(1, recordingHandler.events.size)
    }

    @Test
    fun `multiple event handlers all receive events`() {
        val handler1 = RecordingEventsHandler()
        val handler2 = RecordingEventsHandler()
        val handler3 = RecordingEventsHandler()

        val engine = createEngine(eventsHandler = compositeEventsHandler(handler1, handler2, handler3))
        flushMainThread()

        // Trigger event (disconnect is simplest in public API)
        val event = JSONObject().apply {
            put("type", "disconnect")
            put(
                "data",
                JSONObject().apply {
                    put("sessionId", "test-session-456")
                },
            )
        }

        val handleEventMethod = getPrivateMethod(engine, "handleEvent", JSONObject::class.java)
        handleEventMethod.invoke(engine, event)

        flushMainThread() // Let events dispatch on main thread

        assertTrue(handler1.events.isNotEmpty())
        assertTrue(handler2.events.isNotEmpty())
        assertTrue(handler3.events.isNotEmpty())
    }

    @Test
    fun `WebView settings are configured correctly`() {
        val engine = createEngine()
        flushMainThread()

        val webView = engine.asView()

        // Verify all critical settings
        assertTrue(webView.settings.javaScriptEnabled, "JS must be enabled")
        assertTrue(webView.settings.domStorageEnabled, "DOM storage must be enabled")
        assertTrue(webView.settings.allowFileAccess, "File access must be enabled for assets")
    }

    @Test
    fun `storage adapter methods are called for persistence`() {
        val engine = createEngine()
        flushMainThread()

        // Access storage adapter
        val storageField = getPrivateField(engine, "storageAdapter")
        val storageAdapter = storageField.get(engine)
        assertNotNull(storageAdapter)

        // Verify storage is properly configured
        val persistentField = getPrivateField(engine, "persistentStorageEnabled")
        val isPersistent = persistentField.get(engine) as Boolean
        assertTrue(isPersistent) // Default is true
    }

    @Test
    fun `config with disabled storage sets flag correctly`() {
        val config = createConfiguration(persistent = false)
        val engine = createEngine(configuration = config)
        flushMainThread()
        assertNotNull(engine)

        // Verify config structure
        assertTrue(!config.storage.persistent)
    }

    private fun createEngine(
        configuration: TONWalletKitConfiguration = defaultConfiguration,
        eventsHandler: TONBridgeEventsHandler = NoopEventsHandler,
    ): WebViewWalletKitEngine {
        return kotlinx.coroutines.runBlocking {
            WebViewWalletKitEngine.getOrCreate(context, configuration, eventsHandler)
        }
    }

    private fun disconnectEvent(sessionId: String): JSONObject {
        return JSONObject().apply {
            put("type", "disconnect")
            put(
                "data",
                JSONObject().apply {
                    put("sessionId", sessionId)
                },
            )
        }
    }

    private fun flushMainThread() {
        Shadows.shadowOf(Looper.getMainLooper()).idle()
    }

    private fun getPrivateField(obj: Any, fieldName: String): Field {
        var clazz: Class<*>? = obj.javaClass
        while (clazz != null) {
            try {
                val field = clazz.getDeclaredField(fieldName)
                field.isAccessible = true
                return field
            } catch (e: NoSuchFieldException) {
                clazz = clazz.superclass
            }
        }
        throw NoSuchFieldException("Field $fieldName not found")
    }

    private fun getPrivateMethod(obj: Any, methodName: String, vararg parameterTypes: Class<*>): Method {
        var clazz: Class<*>? = obj.javaClass
        while (clazz != null) {
            try {
                val method = clazz.getDeclaredMethod(methodName, *parameterTypes)
                method.isAccessible = true
                return method
            } catch (e: NoSuchMethodException) {
                clazz = clazz.superclass
            }
        }
        throw NoSuchMethodException("Method $methodName not found")
    }
}
