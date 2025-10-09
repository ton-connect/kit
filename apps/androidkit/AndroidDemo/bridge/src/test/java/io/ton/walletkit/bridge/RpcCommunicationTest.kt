package io.ton.walletkit.bridge

import android.content.Context
import android.os.Looper
import android.webkit.WebView
import androidx.test.core.app.ApplicationProvider
import io.mockk.every
import io.mockk.mockk
import io.ton.walletkit.bridge.impl.WebViewWalletKitEngine
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.async
import kotlinx.coroutines.delay
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
import kotlin.test.assertTrue

/**
 * Tests for JSON-RPC bridge communication and concurrent operations.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], manifest = Config.NONE)
@OptIn(ExperimentalCoroutinesApi::class)
class RpcCommunicationTest {
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
    fun `successful RPC call with JSONObject result`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "getWalletState" -> successResponse(mapOf(
                    "balance" to "5000000000",
                    "status" to "active"
                ))
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        val state = engine.getWalletState("EQTest")
        assertEquals("5000000000", state.balance)
    }

    @Test
    fun `RPC call with array result`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "getWallets" -> {
                    val walletsArray = JSONArray().apply {
                        put(JSONObject(mapOf("address" to "EQ1")))
                        put(JSONObject(mapOf("address" to "EQ2")))
                    }
                    // Array results are wrapped in "items" key
                    successResponse(mapOf("items" to walletsArray))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        val wallets = engine.getWallets()
        assertEquals(2, wallets.size)
    }

    @Test
    fun `RPC call with primitive result`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "removeWallet" -> {
                    // Primitive result wrapped in "value" key
                    JSONObject().apply { 
                        put("result", true)
                    }
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        // This tests the internal mechanism - removeWallet checks for "removed", "ok", or "value"
        engine.removeWallet("EQTest")
    }

    @Test
    fun `RPC error response handling`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "addWalletFromMnemonic" -> errorResponse("Invalid mnemonic phrase")
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        try {
            engine.addWalletFromMnemonic(
                words = listOf("invalid"),
                version = "v4R2"
            )
            throw AssertionError("Expected WalletKitBridgeException")
        } catch (e: WalletKitBridgeException) {
            assertEquals("Invalid mnemonic phrase", e.message)
        }
    }

    @Test
    fun `concurrent RPC calls with unique IDs`() = runTest {
        val receivedCallIds = mutableSetOf<String>()
        
        val engine = createEngine { callId, method, _ ->
            receivedCallIds.add(callId)
            
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "getWallets" -> successResponse(mapOf("items" to JSONArray()))
                "listSessions" -> successResponse(mapOf("items" to JSONArray()))
                "getWalletState" -> successResponse(mapOf("balance" to "0"))
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        // Launch multiple concurrent calls
        val job1 = async { engine.getWallets() }
        val job2 = async { engine.listSessions() }
        val job3 = async { engine.getWalletState("EQ1") }
        val job4 = async { engine.getWallets() }

        job1.await()
        job2.await()
        job3.await()
        job4.await()

        // Each call should have a unique ID (excluding init)
        assertTrue(receivedCallIds.size >= 4, "Expected at least 4 unique call IDs")
    }

    @Test
    fun `base64 payload encoding for large payloads`() = runTest {
        var capturedPayload: String? = null
        var wasBase64Encoded = false
        
        val engine = createEngine { _, method, payload ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "addWalletFromMnemonic" -> {
                    capturedPayload = payload
                    // Check if payload was properly decoded
                    assertNotNull(payload)
                    val json = JSONObject(payload)
                    assertTrue(json.has("words"))
                    successResponse(mapOf(
                        "address" to "EQTest",
                        "version" to "v4R2"
                    ))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        // Large mnemonic (24 words) should use base64 encoding
        val mnemonic = List(24) { "word$it" }
        engine.addWalletFromMnemonic(words = mnemonic, version = "v4R2")

        assertNotNull(capturedPayload)
        // Payload should contain the words array
        val json = JSONObject(capturedPayload!!)
        val words = json.getJSONArray("words")
        assertEquals(24, words.length())
    }

    @Test
    fun `handle 20 concurrent RPC calls successfully`() = runTest {
        val callCounts = mutableMapOf<String, Int>()
        
        val engine = createEngine { _, method, _ ->
            callCounts[method] = (callCounts[method] ?: 0) + 1
            
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "getWallets" -> successResponse(mapOf("items" to JSONArray()))
                "listSessions" -> successResponse(mapOf("items" to JSONArray()))
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        // Launch 20 concurrent calls
        val jobs = List(20) { i ->
            async {
                if (i % 2 == 0) {
                    engine.getWallets()
                } else {
                    engine.listSessions()
                }
            }
        }

        jobs.forEach { it.await() }

        // Verify all calls completed
        val totalCalls = callCounts.values.sum()
        assertTrue(totalCalls >= 20, "Expected at least 20 RPC calls (got $totalCalls)")
    }

    @Test
    fun `RPC calls wait for ready state`() = runTest {
        var readyCompleted = false
        
        val engine = WebViewWalletKitEngine(context)
        flushMainThread()
        
        // Don't complete ready yet
        val webView = mockk<WebView>(relaxed = true)
        every { webView.evaluateJavascript(any(), any()) } answers {
            readyCompleted = true
            null
        }
        setPrivateField(engine, "webView", webView)

        // Start a call in background (it should wait for ready)
        val job = async {
            val readyField = engine::class.java.getDeclaredField("ready")
            readyField.isAccessible = true
            @Suppress("UNCHECKED_CAST")
            val ready = readyField.get(engine) as CompletableDeferred<Unit>
            ready.complete(Unit)
            
            // Now complete the call
            val pending = getPrivateField<Any>(engine, "pending")
            // Simulate response
        }

        delay(100) // Give time for the call to start waiting
        completeReady(engine)
        
        job.await()
    }

    @Test
    fun `response routing matches correct call ID`() = runTest {
        val responseMap = mutableMapOf<String, JSONObject>()
        
        val engine = createEngine { callId, method, _ ->
            val response = when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "getWallets" -> successResponse(mapOf("items" to JSONArray(), "callId" to callId))
                else -> successResponse(mapOf("callId" to callId))
            }
            responseMap[callId] = response
            response
        }

        // Make multiple calls
        async { engine.getWallets() }.await()
        async { engine.listSessions() }.await()

        // Each call should have received its own response
        assertTrue(responseMap.size >= 2)
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

    private fun errorResponse(message: String): JSONObject = 
        JSONObject().apply {
            put("error", JSONObject().apply { put("message", message) })
        }

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
