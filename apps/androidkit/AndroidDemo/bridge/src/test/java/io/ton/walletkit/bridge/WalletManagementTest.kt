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
import kotlin.test.assertFailsWith
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

/**
 * Tests for wallet creation, retrieval, and removal functionality.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], manifest = Config.NONE)
@OptIn(ExperimentalCoroutinesApi::class)
class WalletManagementTest {
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
    fun `add wallet from valid 24-word mnemonic`() = runTest {
        val testMnemonic = listOf(
            "abandon", "ability", "able", "about", "above", "absent",
            "absorb", "abstract", "absurd", "abuse", "access", "accident",
            "account", "accuse", "achieve", "acid", "acoustic", "acquire",
            "across", "act", "action", "actor", "actress", "actual"
        )

        val engine = createEngine { _, method, payload ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "addWalletFromMnemonic" -> {
                    val json = JSONObject(payload!!)
                    val words = json.getJSONArray("words")
                    assertEquals(24, words.length())
                    
                    successResponse(mapOf(
                        "address" to "EQDKbjIcfM6ezt8KjKJJLshZJJSqX7XOA4ff-W72r5gqPrHF",
                        "publicKey" to "82a0b2e3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1",
                        "version" to "v4R2",
                        "network" to "testnet",
                        "index" to 0
                    ))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        val wallet = engine.addWalletFromMnemonic(
            words = testMnemonic,
            version = "v4R2",
            network = "testnet"
        )

        assertNotNull(wallet)
        assertEquals("EQDKbjIcfM6ezt8KjKJJLshZJJSqX7XOA4ff-W72r5gqPrHF", wallet.address)
        assertEquals("v4R2", wallet.version)
        assertEquals("testnet", wallet.network)
    }

    @Test
    fun `add wallet from valid 12-word mnemonic`() = runTest {
        val testMnemonic = listOf(
            "abandon", "ability", "able", "about", "above", "absent",
            "absorb", "abstract", "absurd", "abuse", "access", "accident"
        )

        val engine = createEngine { _, method, payload ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "addWalletFromMnemonic" -> {
                    val json = JSONObject(payload!!)
                    val words = json.getJSONArray("words")
                    assertEquals(12, words.length())
                    
                    successResponse(mapOf(
                        "address" to "EQTest12WordAddress",
                        "version" to "v4R2",
                        "network" to "testnet"
                    ))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        val wallet = engine.addWalletFromMnemonic(
            words = testMnemonic,
            version = "v4R2"
        )

        assertNotNull(wallet)
        assertEquals("EQTest12WordAddress", wallet.address)
    }

    @Test
    fun `add v5R1 wallet`() = runTest {
        val testMnemonic = List(24) { "word" }

        val engine = createEngine { _, method, payload ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "addWalletFromMnemonic" -> {
                    val json = JSONObject(payload!!)
                    assertEquals("v5r1", json.getString("version"))
                    
                    successResponse(mapOf(
                        "address" to "EQV5R1WalletAddress",
                        "version" to "v5r1",
                        "network" to "testnet"
                    ))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        val wallet = engine.addWalletFromMnemonic(
            words = testMnemonic,
            version = "v5r1"
        )

        assertEquals("v5r1", wallet.version)
    }

    @Test
    fun `add wallet with custom name`() = runTest {
        val testMnemonic = List(24) { "word" }

        val engine = createEngine { _, method, payload ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "addWalletFromMnemonic" -> {
                    val json = JSONObject(payload!!)
                    assertEquals("My Main Wallet", json.getString("name"))
                    
                    successResponse(mapOf(
                        "address" to "EQTestAddress",
                        "name" to "My Main Wallet",
                        "version" to "v4R2"
                    ))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        val wallet = engine.addWalletFromMnemonic(
            words = testMnemonic,
            name = "My Main Wallet",
            version = "v4R2"
        )

        assertEquals("My Main Wallet", wallet.name)
    }

    @Test
    fun `add wallet with explicit network`() = runTest {
        val testMnemonic = List(24) { "word" }

        val engine = createEngine { _, method, payload ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "addWalletFromMnemonic" -> {
                    val json = JSONObject(payload!!)
                    assertEquals("mainnet", json.getString("network"))
                    
                    successResponse(mapOf(
                        "address" to "EQMainnetAddress",
                        "version" to "v4R2",
                        "network" to "mainnet"
                    ))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        val wallet = engine.addWalletFromMnemonic(
            words = testMnemonic,
            version = "v4R2",
            network = "mainnet"
        )

        assertEquals("mainnet", wallet.network)
    }

    @Test
    fun `invalid mnemonic throws exception`() = runTest {
        val invalidMnemonic = listOf("invalid", "gibberish", "words")

        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "addWalletFromMnemonic" -> errorResponse("Invalid mnemonic phrase")
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        assertFailsWith<WalletKitBridgeException> {
            engine.addWalletFromMnemonic(
                words = invalidMnemonic,
                version = "v4R2"
            )
        }
    }

    @Test
    fun `get empty wallets list`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "getWallets" -> successResponse(mapOf("items" to JSONArray()))
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        val wallets = engine.getWallets()
        assertTrue(wallets.isEmpty())
    }

    @Test
    fun `get wallets after adding multiple`() = runTest {
        val engine = createEngine { _, method, _ ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "getWallets" -> {
                    val walletsArray = JSONArray().apply {
                        put(JSONObject(mapOf(
                            "address" to "EQWallet1",
                            "version" to "v4R2",
                            "network" to "testnet",
                            "index" to 0
                        )))
                        put(JSONObject(mapOf(
                            "address" to "EQWallet2",
                            "version" to "v5r1",
                            "network" to "mainnet",
                            "index" to 1
                        )))
                        put(JSONObject(mapOf(
                            "address" to "EQWallet3",
                            "name" to "My Wallet",
                            "version" to "v4R2",
                            "network" to "testnet",
                            "index" to 2
                        )))
                    }
                    successResponse(mapOf("items" to walletsArray))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        val wallets = engine.getWallets()
        assertEquals(3, wallets.size)
        assertEquals("EQWallet1", wallets[0].address)
        assertEquals("EQWallet2", wallets[1].address)
        assertEquals("EQWallet3", wallets[2].address)
        assertEquals("My Wallet", wallets[2].name)
    }

    @Test
    fun `remove existing wallet`() = runTest {
        val engine = createEngine { _, method, payload ->
            when (method) {
                "init" -> successResponse(mapOf("ok" to true))
                "removeWallet" -> {
                    val json = JSONObject(payload!!)
                    assertEquals("EQWalletToRemove", json.getString("address"))
                    successResponse(mapOf("removed" to true))
                }
                else -> successResponse(emptyMap<String, Any>())
            }
        }

        // Should not throw
        engine.removeWallet("EQWalletToRemove")
    }

    @Test
    fun `remove non-existent wallet throws exception`() = runTest {
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
}
