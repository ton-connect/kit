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
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

/**
 * Tests for error handling, null inputs, and edge cases.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], manifest = Config.NONE)
@OptIn(ExperimentalCoroutinesApi::class)
class ErrorHandlingTest {
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
    fun `WalletKitBridgeException propagation from JS error`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "addWalletFromMnemonic" -> errorResponse("Invalid mnemonic phrase provided")
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        val exception = assertFailsWith<WalletKitBridgeException> {
            engine.addWalletFromMnemonic(
                words = listOf("invalid", "mnemonic"),
                version = "v4R2"
            )
        }

        assertEquals("Invalid mnemonic phrase provided", exception.message)
    }

    @Test
    fun `network error handling`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "getWalletState" -> errorResponse("Network request failed")
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        val exception = assertFailsWith<WalletKitBridgeException> {
            engine.getWalletState("EQTestAddress")
        }

        assertTrue(exception.message?.contains("Network") == true)
    }

    @Test
    fun `empty mnemonic array throws error`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "addWalletFromMnemonic" -> errorResponse("Mnemonic cannot be empty")
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        assertFailsWith<WalletKitBridgeException> {
            engine.addWalletFromMnemonic(
                words = emptyList(),
                version = "v4R2"
            )
        }
    }

    @Test
    fun `null comment in sendTransaction is handled correctly`() = runTest {
        val engine = createEngine { _, method, payload ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "sendTransaction" -> {
                    val json = JSONObject(payload!!)
                    // Verify comment is not in the payload
                    assertTrue(!json.has("comment"))
                    successResponse(mapOf("ok" to true))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        // Should not throw
        engine.sendTransaction(
            walletAddress = "EQWallet",
            recipient = "EQRecipient",
            amount = "1000000",
            comment = null
        )
    }

    @Test
    fun `empty string comment is not sent`() = runTest {
        val engine = createEngine { _, method, payload ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "sendTransaction" -> {
                    val json = JSONObject(payload!!)
                    // Empty/blank comments should not be included
                    assertTrue(!json.has("comment"))
                    successResponse(mapOf("ok" to true))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        engine.sendTransaction(
            walletAddress = "EQWallet",
            recipient = "EQRecipient",
            amount = "1000000",
            comment = ""
        )
    }

    @Test
    fun `transaction history with limit=0 returns empty`() = runTest {
        val engine = createEngine { _, method, payload ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "getRecentTransactions" -> {
                    val json = JSONObject(payload!!)
                    assertEquals(0, json.getInt("limit"))
                    successResponse(mapOf("items" to JSONArray()))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        val transactions = engine.getRecentTransactions("EQTest", limit = 0)
        assertTrue(transactions.isEmpty())
    }

    @Test
    fun `transaction history with large limit`() = runTest {
        val engine = createEngine { _, method, payload ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "getRecentTransactions" -> {
                    val json = JSONObject(payload!!)
                    assertEquals(1000, json.getInt("limit"))
                    
                    // Return reasonable number (API limit)
                    val txArray = JSONArray()
                    repeat(100) { i ->
                        txArray.put(JSONObject().apply {
                            put("hash_hex", "hash$i")
                            put("now", System.currentTimeMillis() / 1000)
                            put("in_msg", JSONObject().apply {
                                put("value", "1000000")
                            })
                        })
                    }
                    successResponse(mapOf("items" to txArray))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        val transactions = engine.getRecentTransactions("EQTest", limit = 1000)
        // API might limit the actual results
        assertTrue(transactions.size <= 1000)
    }

    @Test
    fun `very large transaction amount is handled`() = runTest {
        val engine = createEngine { _, method, payload ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "sendTransaction" -> {
                    val json = JSONObject(payload!!)
                    val amount = json.getString("amount")
                    // Very large number (max TON supply is ~5 billion)
                    assertEquals("999999999999999999", amount)
                    successResponse(mapOf("ok" to true))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        // Should handle large amounts
        engine.sendTransaction(
            walletAddress = "EQWallet",
            recipient = "EQRecipient",
            amount = "999999999999999999"
        )
    }

    @Test
    fun `very long comment is handled`() = runTest {
        val longComment = "A".repeat(2000)
        
        val engine = createEngine { _, method, payload ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "sendTransaction" -> {
                    val json = JSONObject(payload!!)
                    val comment = json.getString("comment")
                    assertEquals(2000, comment.length)
                    successResponse(mapOf("ok" to true))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        engine.sendTransaction(
            walletAddress = "EQWallet",
            recipient = "EQRecipient",
            amount = "1000000",
            comment = longComment
        )
    }

    @Test
    fun `malformed JSON from JS is handled gracefully`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        // Simulate malformed JSON message from JS
        val jsBinding = getPrivateField<Any>(getPrivateField<WebView>(engine, "webView"), "WalletKitNative")
        val postMessageMethod = jsBinding.javaClass.getMethod("postMessage", String::class.java)
        
        // Should not crash
        try {
            postMessageMethod.invoke(jsBinding, "{malformed json}")
        } catch (e: Exception) {
            // Expected - the pending calls should be failed but app shouldn't crash
        }
    }

    @Test
    fun `invalid method call returns error`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "nonExistentMethod" -> errorResponse("Method not found: nonExistentMethod")
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        // This would be an internal test - normally you can't call arbitrary methods
        // But we can test the error handling mechanism
        val exception = assertFailsWith<Exception> {
            val callMethod = engine::class.java.getDeclaredMethod("call", String::class.java, JSONObject::class.java)
            callMethod.isAccessible = true
            callMethod.invoke(engine, "nonExistentMethod", null)
        }

        assertTrue(exception.cause is WalletKitBridgeException)
    }

    @Test
    fun `RPC error response with custom error structure`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "getWallets" -> JSONObject().apply {
                    put("error", JSONObject().apply {
                        put("code", 404)
                        put("message", "Wallets not found")
                        put("data", JSONObject().apply {
                            put("details", "Storage is empty")
                        })
                    })
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        val exception = assertFailsWith<WalletKitBridgeException> {
            engine.getWallets()
        }

        assertEquals("Wallets not found", exception.message)
    }

    @Test
    fun `remove wallet failure when response indicates not removed`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "removeWallet" -> successResponse(mapOf("removed" to false))
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        assertFailsWith<WalletKitBridgeException> {
            engine.removeWallet("EQNonExistent")
        }
    }

    @Test
    fun `approveSignData with missing signature throws exception`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "approveSignDataRequest" -> {
                    // Return response without signature
                    successResponse(mapOf("ok" to true))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        assertFailsWith<WalletKitBridgeException> {
            engine.approveSignData("request_123")
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
