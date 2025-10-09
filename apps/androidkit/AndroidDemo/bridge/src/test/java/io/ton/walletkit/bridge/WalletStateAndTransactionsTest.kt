package io.ton.walletkit.bridge

import android.content.Context
import android.os.Looper
import android.webkit.WebView
import androidx.test.core.app.ApplicationProvider
import io.mockk.every
import io.mockk.mockk
import io.ton.walletkit.bridge.impl.WebViewWalletKitEngine
import io.ton.walletkit.bridge.model.Transaction
import io.ton.walletkit.bridge.model.TransactionType
import io.ton.walletkit.bridge.model.WalletState
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
import kotlin.test.assertNull
import kotlin.test.assertTrue

/**
 * Tests for wallet state retrieval and transaction operations.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], manifest = Config.NONE)
@OptIn(ExperimentalCoroutinesApi::class)
class WalletStateAndTransactionsTest {
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
    fun `get wallet state with balance`() = runTest {
        val engine = createEngine { _, method, payload ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "getWalletState" -> {
                    val json = JSONObject(payload!!)
                    assertEquals("EQTestAddress", json.getString("address"))
                    
                    successResponse(mapOf(
                        "balance" to "1000000000",
                        "transactions" to JSONArray()
                    ))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        val state = engine.getWalletState("EQTestAddress")
        
        assertNotNull(state)
        assertEquals("1000000000", state.balance)
        assertTrue(state.transactions.isEmpty())
    }

    @Test
    fun `get wallet state with zero balance`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "getWalletState" -> successResponse(mapOf(
                    "balance" to "0",
                    "transactions" to JSONArray()
                ))
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        val state = engine.getWalletState("EQNewWallet")
        
        assertEquals("0", state.balance)
    }

    @Test
    fun `get recent transactions - empty wallet`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "getRecentTransactions" -> successResponse(mapOf(
                    "items" to JSONArray()
                ))
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        val transactions = engine.getRecentTransactions("EQEmptyWallet", limit = 10)
        
        assertTrue(transactions.isEmpty())
    }

    @Test
    fun `get recent transactions with limit`() = runTest {
        val engine = createEngine { _, method, payload ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "getRecentTransactions" -> {
                    val json = JSONObject(payload!!)
                    assertEquals(5, json.getInt("limit"))
                    
                    val txArray = JSONArray()
                    repeat(5) { i ->
                        txArray.put(createTransactionJson(
                            hash = "hash$i",
                            value = "100000000",
                            isIncoming = i % 2 == 0
                        ))
                    }
                    
                    successResponse(mapOf("items" to txArray))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        val transactions = engine.getRecentTransactions("EQTestAddress", limit = 5)
        
        assertEquals(5, transactions.size)
    }

    @Test
    fun `transaction type detection - INCOMING`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "getRecentTransactions" -> {
                    val txArray = JSONArray().apply {
                        put(createTransactionJson(
                            hash = "incoming_tx",
                            value = "500000000",
                            isIncoming = true,
                            source = "EQSenderAddress"
                        ))
                    }
                    successResponse(mapOf("items" to txArray))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        val transactions = engine.getRecentTransactions("EQTestAddress")
        
        assertEquals(1, transactions.size)
        val tx = transactions[0]
        assertEquals(TransactionType.INCOMING, tx.type)
        assertNotNull(tx.sender)
        assertEquals("EQSenderAddress", tx.sender)
        assertNull(tx.recipient)
    }

    @Test
    fun `transaction type detection - OUTGOING`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "getRecentTransactions" -> {
                    val txArray = JSONArray().apply {
                        put(createTransactionJson(
                            hash = "outgoing_tx",
                            value = "300000000",
                            isIncoming = false,
                            destination = "EQRecipientAddress"
                        ))
                    }
                    successResponse(mapOf("items" to txArray))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        val transactions = engine.getRecentTransactions("EQTestAddress")
        
        assertEquals(1, transactions.size)
        val tx = transactions[0]
        assertEquals(TransactionType.OUTGOING, tx.type)
        assertNotNull(tx.recipient)
        assertEquals("EQRecipientAddress", tx.recipient)
        assertNull(tx.sender)
    }

    @Test
    fun `transaction parsing - all fields`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "getRecentTransactions" -> {
                    val txArray = JSONArray().apply {
                        put(JSONObject().apply {
                            put("hash_hex", "abc123def456")
                            put("now", 1696800000L) // Unix timestamp in seconds
                            put("in_msg", JSONObject().apply {
                                put("value", "1000000000")
                                put("comment", "Payment for services")
                                put("source_friendly", "EQSender123")
                            })
                            put("total_fees", "5000000")
                            put("lt", "47123456789000")
                            put("mc_block_seqno", 12345678)
                        })
                    }
                    successResponse(mapOf("items" to txArray))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        val transactions = engine.getRecentTransactions("EQTestAddress")
        
        assertEquals(1, transactions.size)
        val tx = transactions[0]
        
        assertEquals("abc123def456", tx.hash)
        assertEquals(1696800000000L, tx.timestamp) // Converted to milliseconds
        assertEquals("1000000000", tx.amount)
        assertEquals("5000000", tx.fee)
        assertEquals("Payment for services", tx.comment)
        assertEquals("47123456789000", tx.lt)
        assertEquals(12345678, tx.blockSeqno)
    }

    @Test
    fun `jetton transactions are filtered out`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "getRecentTransactions" -> {
                    val txArray = JSONArray().apply {
                        // Regular TON transaction
                        put(createTransactionJson(
                            hash = "ton_tx",
                            value = "100000000",
                            isIncoming = true
                        ))
                        
                        // Jetton transaction (has op_code)
                        put(JSONObject().apply {
                            put("hash_hex", "jetton_tx")
                            put("now", 1696800000L)
                            put("in_msg", JSONObject().apply {
                                put("value", "0")
                                put("op_code", "0xf8a7ea5") // Jetton transfer op code
                            })
                        })
                    }
                    successResponse(mapOf("items" to txArray))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        val transactions = engine.getRecentTransactions("EQTestAddress")
        
        // Should only return the TON transaction, jetton filtered out
        assertEquals(1, transactions.size)
        assertEquals("ton_tx", transactions[0].hash)
    }

    @Test
    fun `send transaction with all parameters`() = runTest {
        val engine = createEngine { _, method, payload ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "sendTransaction" -> {
                    val json = JSONObject(payload!!)
                    assertEquals("EQWalletAddress", json.getString("walletAddress"))
                    assertEquals("EQRecipient", json.getString("toAddress"))
                    assertEquals("1000000000", json.getString("amount"))
                    assertEquals("Test payment", json.getString("comment"))
                    
                    successResponse(mapOf("ok" to true))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        // Should not throw
        engine.sendTransaction(
            walletAddress = "EQWalletAddress",
            recipient = "EQRecipient",
            amount = "1000000000",
            comment = "Test payment"
        )
    }

    @Test
    fun `send transaction without comment`() = runTest {
        val engine = createEngine { _, method, payload ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "sendTransaction" -> {
                    val json = JSONObject(payload!!)
                    assertEquals("EQWalletAddress", json.getString("walletAddress"))
                    assertEquals("EQRecipient", json.getString("toAddress"))
                    assertEquals("500000000", json.getString("amount"))
                    // Comment should not be present
                    assertTrue(!json.has("comment"))
                    
                    successResponse(mapOf("ok" to true))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        engine.sendTransaction(
            walletAddress = "EQWalletAddress",
            recipient = "EQRecipient",
            amount = "500000000",
            comment = null
        )
    }

    // Helper functions
    private fun createTransactionJson(
        hash: String,
        value: String,
        isIncoming: Boolean,
        source: String? = null,
        destination: String? = null,
        comment: String? = null
    ): JSONObject = JSONObject().apply {
        put("hash_hex", hash)
        put("now", System.currentTimeMillis() / 1000)
        
        if (isIncoming) {
            put("in_msg", JSONObject().apply {
                put("value", value)
                source?.let { put("source_friendly", it) }
                comment?.let { put("comment", it) }
            })
        } else {
            put("in_msg", JSONObject().apply {
                put("value", "0")
            })
            put("out_msgs", JSONArray().apply {
                put(JSONObject().apply {
                    put("value", value)
                    destination?.let { put("destination_friendly", it) }
                    comment?.let { put("comment", it) }
                })
            })
        }
    }

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
}
