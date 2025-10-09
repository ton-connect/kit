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
import io.ton.walletkit.bridge.model.SignDataResult
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
 * Tests for TonConnect protocol integration (connect, transaction, sign data).
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], manifest = Config.NONE)
@OptIn(ExperimentalCoroutinesApi::class)
class TonConnectIntegrationTest {
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
    fun `handle TonConnect URL triggers connect request event`() = runTest {
        var capturedEvent: WalletKitEvent? = null
        var engineRef: WebViewWalletKitEngine? = null
        
        val engine = createEngine { _, method, payload ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "handleTonConnectUrl" -> {
                    val json = JSONObject(payload!!)
                    assertEquals("tc://connect?...", json.getString("url"))
                    
                    // Simulate event emission
                    val eventJson = JSONObject().apply {
                        put("type", "connectRequest")
                        put("data", JSONObject().apply {
                            put("id", "request_123")
                            put("dAppName", "Test dApp")
                            put("dAppUrl", "https://test-dapp.com")
                            put("permissions", JSONArray().apply {
                                put("ton_addr")
                                put("ton_proof")
                            })
                        })
                    }
                    engineRef?.let { invokeHandleEvent(it, eventJson) }
                    
                    successResponse(mapOf("ok" to true))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }
        engineRef = engine

        engine.addEventHandler(object : WalletKitEventHandler {
            override fun handleEvent(event: WalletKitEvent) {
                capturedEvent = event
            }
        })

        engine.handleTonConnectUrl("tc://connect?...")

        flushMainThread()
        
        assertNotNull(capturedEvent)
        assertIs<WalletKitEvent.ConnectRequestEvent>(capturedEvent)
        val connectEvent = capturedEvent as WalletKitEvent.ConnectRequestEvent
        assertEquals("Test dApp", connectEvent.request.dAppInfo?.name)
        assertEquals(2, connectEvent.request.permissions.size)
    }

    @Test
    fun `approve connect request`() = runTest {
        val engine = createEngine { _, method, payload ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "approveConnectRequest" -> {
                    val json = JSONObject(payload!!)
                    assertEquals("request_123", json.get("requestId"))
                    assertEquals("EQMyWallet", json.getString("walletAddress"))
                    
                    successResponse(mapOf("ok" to true))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        engine.approveConnect(
            requestId = "request_123",
            walletAddress = "EQMyWallet"
        )
    }

    @Test
    fun `reject connect request`() = runTest {
        val engine = createEngine { _, method, payload ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "rejectConnectRequest" -> {
                    val json = JSONObject(payload!!)
                    assertEquals("request_456", json.get("requestId"))
                    assertEquals("User cancelled", json.getString("reason"))
                    
                    successResponse(mapOf("ok" to true))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        engine.rejectConnect(
            requestId = "request_456",
            reason = "User cancelled"
        )
    }

    @Test
    fun `approve transaction request`() = runTest {
        val engine = createEngine { _, method, payload ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "approveTransactionRequest" -> {
                    val json = JSONObject(payload!!)
                    assertEquals("tx_request_789", json.get("requestId"))
                    
                    successResponse(mapOf("ok" to true))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        engine.approveTransaction(requestId = "tx_request_789")
    }

    @Test
    fun `reject transaction request`() = runTest {
        val engine = createEngine { _, method, payload ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "rejectTransactionRequest" -> {
                    val json = JSONObject(payload!!)
                    assertEquals("tx_request_999", json.get("requestId"))
                    assertEquals("Insufficient funds", json.getString("reason"))
                    
                    successResponse(mapOf("ok" to true))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        engine.rejectTransaction(
            requestId = "tx_request_999",
            reason = "Insufficient funds"
        )
    }

    @Test
    fun `transaction request event parsing`() = runTest {
        var capturedEvent: WalletKitEvent? = null
        
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        engine.addEventHandler(object : WalletKitEventHandler {
            override fun handleEvent(event: WalletKitEvent) {
                capturedEvent = event
            }
        })

        val txEventJson = JSONObject().apply {
            put("type", "transactionRequest")
            put("data", JSONObject().apply {
                put("id", "tx_req_123")
                put("dAppName", "DeFi App")
                put("messages", JSONArray().apply {
                    put(JSONObject().apply {
                        put("address", "EQRecipient")
                        put("amount", "1000000000")
                        put("comment", "Payment")
                    })
                })
            })
        }
        
        invokeHandleEvent(engine, txEventJson)
        flushMainThread()

        assertNotNull(capturedEvent)
        assertIs<WalletKitEvent.TransactionRequestEvent>(capturedEvent)
        val txEvent = capturedEvent as WalletKitEvent.TransactionRequestEvent
        assertEquals("EQRecipient", txEvent.request.request.recipient)
        assertEquals("1000000000", txEvent.request.request.amount)
        assertEquals("Payment", txEvent.request.request.comment)
    }

    @Test
    fun `approve sign data request - text payload`() = runTest {
        val engine = createEngine { _, method, payload ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "approveSignDataRequest" -> {
                    val json = JSONObject(payload!!)
                    assertEquals("sign_req_123", json.get("requestId"))
                    
                    successResponse(mapOf(
                        "signature" to "base64EncodedSignature123=="
                    ))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        val result = engine.approveSignData(requestId = "sign_req_123")

        assertNotNull(result)
        assertEquals("base64EncodedSignature123==", result.signature)
    }

    @Test
    fun `reject sign data request`() = runTest {
        val engine = createEngine { _, method, payload ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "rejectSignDataRequest" -> {
                    val json = JSONObject(payload!!)
                    assertEquals("sign_req_456", json.get("requestId"))
                    assertEquals("User rejected", json.getString("reason"))
                    
                    successResponse(mapOf("ok" to true))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        engine.rejectSignData(
            requestId = "sign_req_456",
            reason = "User rejected"
        )
    }

    @Test
    fun `sign data request event parsing`() = runTest {
        var capturedEvent: WalletKitEvent? = null
        
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        engine.addEventHandler(object : WalletKitEventHandler {
            override fun handleEvent(event: WalletKitEvent) {
                capturedEvent = event
            }
        })

        val signEventJson = JSONObject().apply {
            put("type", "signDataRequest")
            put("data", JSONObject().apply {
                put("id", "sign_123")
                put("dAppName", "Auth App")
                put("params", JSONArray().apply {
                    put(JSONObject().apply {
                        put("payload", "SGVsbG8gV29ybGQ=")
                        put("schema_crc", 0) // text schema
                    }.toString())
                })
            })
        }
        
        invokeHandleEvent(engine, signEventJson)
        flushMainThread()

        assertNotNull(capturedEvent)
        assertIs<WalletKitEvent.SignDataRequestEvent>(capturedEvent)
        val signEvent = capturedEvent as WalletKitEvent.SignDataRequestEvent
        assertEquals("SGVsbG8gV29ybGQ=", signEvent.request.request.payload)
        assertEquals("text", signEvent.request.request.schema)
    }

    @Test
    fun `list sessions - empty`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "listSessions" -> successResponse(mapOf("items" to JSONArray()))
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        val sessions = engine.listSessions()
        
        assertTrue(sessions.isEmpty())
    }

    @Test
    fun `list sessions - multiple active`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "listSessions" -> {
                    val sessionsArray = JSONArray().apply {
                        put(JSONObject().apply {
                            put("sessionId", "session_1")
                            put("dAppName", "DApp 1")
                            put("walletAddress", "EQWallet1")
                            put("dAppUrl", "https://dapp1.com")
                        })
                        put(JSONObject().apply {
                            put("sessionId", "session_2")
                            put("dAppName", "DApp 2")
                            put("walletAddress", "EQWallet2")
                            put("iconUrl", "https://dapp2.com/icon.png")
                        })
                    }
                    successResponse(mapOf("items" to sessionsArray))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        val sessions = engine.listSessions()
        
        assertEquals(2, sessions.size)
        assertEquals("session_1", sessions[0].sessionId)
        assertEquals("DApp 1", sessions[0].dAppName)
        assertEquals("session_2", sessions[1].sessionId)
        assertEquals("DApp 2", sessions[1].dAppName)
    }

    @Test
    fun `disconnect specific session`() = runTest {
        val engine = createEngine { _, method, payload ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "disconnectSession" -> {
                    val json = JSONObject(payload!!)
                    assertEquals("session_to_disconnect", json.getString("sessionId"))
                    
                    successResponse(mapOf("ok" to true))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        engine.disconnectSession("session_to_disconnect")
    }

    @Test
    fun `disconnect all sessions`() = runTest {
        val engine = createEngine { _, method, payload ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "disconnectSession" -> {
                    // When sessionId is null, payload should be null
                    assertTrue(payload == null || payload == "{}")
                    
                    successResponse(mapOf("ok" to true))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        engine.disconnectSession(null)
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
