package io.ton.walletkit.bridge

import android.content.Context
import android.os.Looper
import android.webkit.WebView
import androidx.test.core.app.ApplicationProvider
import io.mockk.every
import io.mockk.mockk
import io.ton.walletkit.bridge.config.WalletKitBridgeConfig
import io.ton.walletkit.bridge.impl.WebViewWalletKitEngine
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
import kotlin.test.assertEquals
import kotlin.test.assertNotNull

/**
 * Tests for network and configuration options.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], manifest = Config.NONE)
@OptIn(ExperimentalCoroutinesApi::class)
class ConfigurationTest {
    private val mainDispatcher = StandardTestDispatcher()
    private lateinit var context: Context

    @Before
    fun setUp() {
        Dispatchers.setMain(mainDispatcher)
        context = ApplicationProvider.getApplicationContext()
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `mainnet configuration`() = runTest {
        var capturedConfig: JSONObject? = null
        
        val engine = createEngine { _, method, payload ->
            when (method) {
                "init" -> {
                    capturedConfig = payload?.let { JSONObject(it) }
                    successResponse(mapOf("ok" to true))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        val config = WalletKitBridgeConfig(
            network = "mainnet",
            tonApiUrl = "https://tonapi.io"
        )
        
        engine.init(config)

        assertNotNull(capturedConfig)
        assertEquals("mainnet", capturedConfig!!.getString("network"))
        assertEquals("https://tonapi.io", capturedConfig!!.getString("tonApiUrl"))
        // Should use mainnet endpoint
        assertEquals("https://toncenter.com/api/v2/jsonRPC", 
            capturedConfig!!.getString("apiUrl"))
    }

    @Test
    fun `testnet configuration (default)`() = runTest {
        var capturedConfig: JSONObject? = null
        
        val engine = createEngine { _, method, payload ->
            when (method) {
                "init" -> {
                    capturedConfig = payload?.let { JSONObject(it) }
                    successResponse(mapOf("ok" to true))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        // Default config should use testnet
        engine.init(WalletKitBridgeConfig())

        assertNotNull(capturedConfig)
        assertEquals("testnet", capturedConfig!!.getString("network"))
        // Should use testnet endpoint
        assertEquals("https://testnet.toncenter.com/api/v2/jsonRPC", 
            capturedConfig!!.getString("apiUrl"))
    }

    @Test
    fun `custom API URL`() = runTest {
        var capturedConfig: JSONObject? = null
        
        val engine = createEngine { _, method, payload ->
            when (method) {
                "init" -> {
                    capturedConfig = payload?.let { JSONObject(it) }
                    successResponse(mapOf("ok" to true))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        val config = WalletKitBridgeConfig(
            network = "testnet",
            tonClientEndpoint = "https://custom-toncenter.com/api/v2/jsonRPC",
            tonApiUrl = "https://custom-tonapi.io"
        )
        
        engine.init(config)

        assertNotNull(capturedConfig)
        assertEquals("https://custom-toncenter.com/api/v2/jsonRPC", 
            capturedConfig!!.getString("apiUrl"))
        assertEquals("https://custom-tonapi.io", 
            capturedConfig!!.getString("tonApiUrl"))
    }

    @Test
    fun `custom bridge URL and name`() = runTest {
        var capturedConfig: JSONObject? = null
        
        val engine = createEngine { _, method, payload ->
            when (method) {
                "init" -> {
                    capturedConfig = payload?.let { JSONObject(it) }
                    successResponse(mapOf("ok" to true))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        val config = WalletKitBridgeConfig(
            network = "testnet",
            bridgeUrl = "https://custom-bridge.tonapi.io/bridge",
            bridgeName = "my-custom-bridge"
        )
        
        engine.init(config)

        assertNotNull(capturedConfig)
        assertEquals("https://custom-bridge.tonapi.io/bridge", 
            capturedConfig!!.getString("bridgeUrl"))
        assertEquals("my-custom-bridge", 
            capturedConfig!!.getString("bridgeName"))
    }

    @Test
    fun `persistent storage enabled by default`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        // Default config should have storage enabled
        val config = WalletKitBridgeConfig()
        engine.init(config)

        // Verify storage is enabled internally
        val storageEnabled = getPrivateField<Boolean>(engine, "persistentStorageEnabled")
        assertEquals(true, storageEnabled)
    }

    @Test
    fun `persistent storage can be disabled`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        val config = WalletKitBridgeConfig(
            enablePersistentStorage = false
        )
        engine.init(config)

        // Verify storage is disabled internally
        val storageEnabled = getPrivateField<Boolean>(engine, "persistentStorageEnabled")
        assertEquals(false, storageEnabled)
    }

    @Test
    fun `API key configuration`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        val config = WalletKitBridgeConfig(
            network = "mainnet",
            apiKey = "my-api-key-123"
        )
        engine.init(config)

        // Verify API key is stored
        val apiKey = getPrivateField<String?>(engine, "tonApiKey")
        assertEquals("my-api-key-123", apiKey)
    }

    @Test
    fun `all configuration options combined`() = runTest {
        var capturedConfig: JSONObject? = null
        
        val engine = createEngine { _, method, payload ->
            when (method) {
                "init" -> {
                    capturedConfig = payload?.let { JSONObject(it) }
                    successResponse(mapOf("ok" to true))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        val config = WalletKitBridgeConfig(
            network = "mainnet",
            tonClientEndpoint = "https://custom-endpoint.com/rpc",
            tonApiUrl = "https://custom-tonapi.io",
            apiKey = "test-key",
            bridgeUrl = "https://bridge.custom.com",
            bridgeName = "custom-bridge",
            enablePersistentStorage = true
        )
        
        engine.init(config)

        assertNotNull(capturedConfig)
        assertEquals("mainnet", capturedConfig!!.getString("network"))
        assertEquals("https://custom-endpoint.com/rpc", capturedConfig!!.getString("apiUrl"))
        assertEquals("https://custom-tonapi.io", capturedConfig!!.getString("tonApiUrl"))
        assertEquals("https://bridge.custom.com", capturedConfig!!.getString("bridgeUrl"))
        assertEquals("custom-bridge", capturedConfig!!.getString("bridgeName"))
        
        // Storage flag is not passed to JS, only used in Android
        val storageEnabled = getPrivateField<Boolean>(engine, "persistentStorageEnabled")
        assertEquals(true, storageEnabled)
        
        val apiKey = getPrivateField<String?>(engine, "tonApiKey")
        assertEquals("test-key", apiKey)
    }

    // Helper functions
    private fun createEngine(
        responseProvider: (callId: String, method: String, payloadJson: String?) -> JSONObject
    ): WebViewWalletKitEngine {
        val engine = WebViewWalletKitEngine(context)
        flushMainThread()
        setPrivateField(engine, "webView", createWebViewStub(engine, responseProvider))
        completeReady(engine)
        return engine
    }

    private fun createWebViewStub(
        engine: WebViewWalletKitEngine,
        responseProvider: (callId: String, method: String, payloadJson: String?) -> JSONObject
    ): WebView {
        val webView = mockk<WebView>(relaxed = true)
        every { webView.evaluateJavascript(any(), any()) } answers {
            val script = firstArg<String>()
            val (callId, method, payloadJson) = parseCallScript(script)
            val response = responseProvider(callId, method, payloadJson)
            invokeHandleResponse(engine, callId, response)
            null
        }
        every { webView.destroy() } returns Unit
        every { webView.stopLoading() } returns Unit
        return webView
    }

    private fun successResponse(data: Map<String, Any>): JSONObject = 
        JSONObject().apply { put("result", JSONObject(data)) }

    private fun flushMainThread() {
        Shadows.shadowOf(Looper.getMainLooper()).runToEndOfTasks()
    }

    private fun completeReady(engine: WebViewWalletKitEngine) {
        val field = engine::class.java.getDeclaredField("ready")
        field.isAccessible = true
        @Suppress("UNCHECKED_CAST")
        val ready = field.get(engine) as CompletableDeferred<Unit>
        if (!ready.isCompleted) {
            ready.complete(Unit)
        }
    }

    private fun invokeHandleResponse(
        engine: WebViewWalletKitEngine,
        callId: String,
        response: JSONObject
    ) {
        val method = engine::class.java.getDeclaredMethod("handleResponse", String::class.java, JSONObject::class.java)
        method.isAccessible = true
        method.invoke(engine, callId, response)
    }

    private fun parseCallScript(script: String): Triple<String, String, String?> {
        val regex = Regex("""__walletkitCall\("([^"]+)","([^"]+)",(.*)\)""")
        val match = regex.find(script) ?: error("Unexpected script format: $script")
        val callId = match.groupValues[1]
        val method = match.groupValues[2]
        val payloadSegment = match.groupValues[3].trim()
        val payload = when {
            payloadSegment == "null" -> null
            payloadSegment.startsWith("atob(") -> {
                val base64 = payloadSegment.removePrefix("atob(").removeSuffix(")")
                val quoted = base64.trim('"')
                String(android.util.Base64.decode(quoted, android.util.Base64.NO_WRAP))
            }
            else -> payloadSegment.trim('"')
        }
        return Triple(callId, method, payload)
    }

    private fun setPrivateField(instance: Any, fieldName: String, value: Any) {
        val field = instance::class.java.getDeclaredField(fieldName)
        field.isAccessible = true
        field.set(instance, value)
    }

    @Suppress("UNCHECKED_CAST")
    private fun <T> getPrivateField(instance: Any, fieldName: String): T {
        val field = instance::class.java.getDeclaredField(fieldName)
        field.isAccessible = true
        return field.get(instance) as T
    }
}
