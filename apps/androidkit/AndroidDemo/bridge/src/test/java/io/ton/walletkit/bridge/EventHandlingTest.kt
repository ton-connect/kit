package io.ton.walletkit.bridge

import android.content.Context
import android.os.Looper
import android.webkit.WebView
import androidx.test.core.app.ApplicationProvider
import io.mockk.every
import io.mockk.mockk
import io.ton.walletkit.bridge.event.WalletKitEvent
import io.ton.walletkit.bridge.impl.WebViewWalletKitEngine
import io.ton.walletkit.bridge.listener.WalletKitEventHandler
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
import kotlin.test.assertIs
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

/**
 * Tests for event handling system and event type parsing.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], manifest = Config.NONE)
@OptIn(ExperimentalCoroutinesApi::class)
class EventHandlingTest {
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
    fun `add single event handler`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        var eventReceived = false
        engine.addEventHandler(object : WalletKitEventHandler {
            override fun handleEvent(event: WalletKitEvent) {
                eventReceived = true
            }
        })

        val eventJson = JSONObject().apply {
            put("type", "stateChanged")
            put("data", JSONObject().apply {
                put("address", "EQTest")
            })
        }
        invokeHandleEvent(engine, eventJson)
        flushMainThread()

        assertTrue(eventReceived)
    }

    @Test
    fun `add multiple event handlers`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        var handler1Called = false
        var handler2Called = false
        var handler3Called = false

        engine.addEventHandler(object : WalletKitEventHandler {
            override fun handleEvent(event: WalletKitEvent) {
                handler1Called = true
            }
        })
        
        engine.addEventHandler(object : WalletKitEventHandler {
            override fun handleEvent(event: WalletKitEvent) {
                handler2Called = true
            }
        })
        
        engine.addEventHandler(object : WalletKitEventHandler {
            override fun handleEvent(event: WalletKitEvent) {
                handler3Called = true
            }
        })

        val eventJson = JSONObject().apply {
            put("type", "sessionsChanged")
            put("data", JSONObject())
        }
        invokeHandleEvent(engine, eventJson)
        flushMainThread()

        assertTrue(handler1Called)
        assertTrue(handler2Called)
        assertTrue(handler3Called)
    }

    @Test
    fun `remove event handler`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        var callCount = 0
        val closeable = engine.addEventHandler(object : WalletKitEventHandler {
            override fun handleEvent(event: WalletKitEvent) {
                callCount++
            }
        })

        // Trigger event - handler should be called
        val eventJson = JSONObject().apply {
            put("type", "stateChanged")
            put("data", JSONObject().apply { put("address", "EQTest") })
        }
        invokeHandleEvent(engine, eventJson)
        flushMainThread()
        assertEquals(1, callCount)

        // Remove handler
        closeable.close()

        // Trigger event again - handler should NOT be called
        invokeHandleEvent(engine, eventJson)
        flushMainThread()
        assertEquals(1, callCount) // Still 1, not incremented
    }

    @Test
    fun `parse ConnectRequestEvent`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        var capturedEvent: WalletKitEvent? = null
        engine.addEventHandler(object : WalletKitEventHandler {
            override fun handleEvent(event: WalletKitEvent) {
                capturedEvent = event
            }
        })

        val eventJson = JSONObject().apply {
            put("type", "connectRequest")
            put("data", JSONObject().apply {
                put("id", "connect_req_123")
                put("dAppName", "Test dApp")
                put("dAppUrl", "https://test.com")
                put("dAppIconUrl", "https://test.com/icon.png")
                put("permissions", JSONArray().apply {
                    put("ton_addr")
                    put("ton_proof")
                })
            })
        }
        invokeHandleEvent(engine, eventJson)
        flushMainThread()

        assertNotNull(capturedEvent)
        assertIs<WalletKitEvent.ConnectRequestEvent>(capturedEvent)
        val event = capturedEvent as WalletKitEvent.ConnectRequestEvent
        assertEquals("Test dApp", event.request.dAppInfo?.name)
        assertEquals("https://test.com", event.request.dAppInfo?.url)
        assertEquals(2, event.request.permissions.size)
    }

    @Test
    fun `parse TransactionRequestEvent`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        var capturedEvent: WalletKitEvent? = null
        engine.addEventHandler(object : WalletKitEventHandler {
            override fun handleEvent(event: WalletKitEvent) {
                capturedEvent = event
            }
        })

        val eventJson = JSONObject().apply {
            put("type", "transactionRequest")
            put("data", JSONObject().apply {
                put("id", "tx_123")
                put("dAppName", "DeFi App")
                put("messages", JSONArray().apply {
                    put(JSONObject().apply {
                        put("address", "EQRecipient")
                        put("amount", "5000000000")
                        put("comment", "Payment for NFT")
                    })
                })
            })
        }
        invokeHandleEvent(engine, eventJson)
        flushMainThread()

        assertNotNull(capturedEvent)
        assertIs<WalletKitEvent.TransactionRequestEvent>(capturedEvent)
        val event = capturedEvent as WalletKitEvent.TransactionRequestEvent
        assertEquals("EQRecipient", event.request.request.recipient)
        assertEquals("5000000000", event.request.request.amount)
    }

    @Test
    fun `parse SignDataRequestEvent`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        var capturedEvent: WalletKitEvent? = null
        engine.addEventHandler(object : WalletKitEventHandler {
            override fun handleEvent(event: WalletKitEvent) {
                capturedEvent = event
            }
        })

        val eventJson = JSONObject().apply {
            put("type", "signDataRequest")
            put("data", JSONObject().apply {
                put("id", "sign_123")
                put("payload", "SGVsbG8gV29ybGQ=")
                put("schema", "text")
            })
        }
        invokeHandleEvent(engine, eventJson)
        flushMainThread()

        assertNotNull(capturedEvent)
        assertIs<WalletKitEvent.SignDataRequestEvent>(capturedEvent)
        val event = capturedEvent as WalletKitEvent.SignDataRequestEvent
        assertEquals("SGVsbG8gV29ybGQ=", event.request.request.payload)
        assertEquals("text", event.request.request.schema)
    }

    @Test
    fun `parse DisconnectEvent`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        var capturedEvent: WalletKitEvent? = null
        engine.addEventHandler(object : WalletKitEventHandler {
            override fun handleEvent(event: WalletKitEvent) {
                capturedEvent = event
            }
        })

        val eventJson = JSONObject().apply {
            put("type", "disconnect")
            put("data", JSONObject().apply {
                put("sessionId", "session_to_disconnect")
            })
        }
        invokeHandleEvent(engine, eventJson)
        flushMainThread()

        assertNotNull(capturedEvent)
        assertIs<WalletKitEvent.DisconnectEvent>(capturedEvent)
        val event = capturedEvent as WalletKitEvent.DisconnectEvent
        assertEquals("session_to_disconnect", event.sessionId)
    }

    @Test
    fun `parse StateChangedEvent`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        var capturedEvent: WalletKitEvent? = null
        engine.addEventHandler(object : WalletKitEventHandler {
            override fun handleEvent(event: WalletKitEvent) {
                capturedEvent = event
            }
        })

        val eventJson = JSONObject().apply {
            put("type", "stateChanged")
            put("data", JSONObject().apply {
                put("address", "EQWalletChanged")
            })
        }
        invokeHandleEvent(engine, eventJson)
        flushMainThread()

        assertNotNull(capturedEvent)
        assertIs<WalletKitEvent.StateChangedEvent>(capturedEvent)
        val event = capturedEvent as WalletKitEvent.StateChangedEvent
        assertEquals("EQWalletChanged", event.address)
    }

    @Test
    fun `parse SessionsChangedEvent`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        var capturedEvent: WalletKitEvent? = null
        engine.addEventHandler(object : WalletKitEventHandler {
            override fun handleEvent(event: WalletKitEvent) {
                capturedEvent = event
            }
        })

        val eventJson = JSONObject().apply {
            put("type", "sessionsChanged")
            put("data", JSONObject())
        }
        invokeHandleEvent(engine, eventJson)
        flushMainThread()

        assertNotNull(capturedEvent)
        assertIs<WalletKitEvent.SessionsChangedEvent>(capturedEvent)
    }

    @Test
    fun `unknown event type is ignored gracefully`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        var anyEventReceived = false
        engine.addEventHandler(object : WalletKitEventHandler {
            override fun handleEvent(event: WalletKitEvent) {
                anyEventReceived = true
            }
        })

        val eventJson = JSONObject().apply {
            put("type", "unknownEventType")
            put("data", JSONObject())
        }
        
        // Should not crash
        invokeHandleEvent(engine, eventJson)
        flushMainThread()

        // Unknown events are not propagated
        assertTrue(!anyEventReceived)
    }

    @Test
    fun `sign data schema parsing from schema_crc`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        val testCases = listOf(
            0 to "text",
            1 to "binary",
            2 to "cell"
        )

        for ((schemaCrc, expectedSchema) in testCases) {
            var capturedEvent: WalletKitEvent? = null
            engine.addEventHandler(object : WalletKitEventHandler {
                override fun handleEvent(event: WalletKitEvent) {
                    capturedEvent = event
                }
            })

            val eventJson = JSONObject().apply {
                put("type", "signDataRequest")
                put("data", JSONObject().apply {
                    put("id", "sign_$schemaCrc")
                    put("params", JSONArray().apply {
                        put(JSONObject().apply {
                            put("payload", "test_payload")
                            put("schema_crc", schemaCrc)
                        }.toString())
                    })
                })
            }
            
            invokeHandleEvent(engine, eventJson)
            flushMainThread()

            assertNotNull(capturedEvent)
            assertIs<WalletKitEvent.SignDataRequestEvent>(capturedEvent)
            val event = capturedEvent as WalletKitEvent.SignDataRequestEvent
            assertEquals(expectedSchema, event.request.request.schema, 
                "schema_crc $schemaCrc should map to $expectedSchema")
        }
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

    private fun invokeHandleEvent(
        engine: WebViewWalletKitEngine,
        event: JSONObject
    ) {
        val method = engine::class.java.getDeclaredMethod("handleEvent", JSONObject::class.java)
        method.isAccessible = true
        method.invoke(engine, event)
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
}
