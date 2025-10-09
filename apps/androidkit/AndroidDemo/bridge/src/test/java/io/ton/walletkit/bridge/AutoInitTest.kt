package io.ton.walletkit.bridge

import android.content.Context
import android.os.Looper
import android.webkit.WebView
import androidx.test.core.app.ApplicationProvider
import io.mockk.MockKAnnotations
import io.mockk.every
import io.mockk.mockk
import io.mockk.unmockkAll
import io.ton.walletkit.bridge.config.WalletKitBridgeConfig
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.async
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
import kotlin.test.assertFalse
import kotlin.test.assertTrue
import kotlin.test.fail

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], manifest = Config.NONE)
@OptIn(ExperimentalCoroutinesApi::class)
class AutoInitTest {
    private val mainDispatcher = StandardTestDispatcher()
    private lateinit var context: Context

    @Before
    fun setUp() {
        Dispatchers.setMain(mainDispatcher)
        MockKAnnotations.init(this, relaxUnitFun = true)
        context = ApplicationProvider.getApplicationContext()
    }

    @After
    fun tearDown() {
        unmockkAll()
        Dispatchers.resetMain()
    }

    @Test
    fun `auto-init runs on first public call`() = runTest {
        var initCallCount = 0
        val engine =
            createEngine { _, method, _ ->
                when (method) {
                    "init" -> {
                        initCallCount++
                        successResponse(jsonObject("ok" to true))
                    }
                    "getWallets" -> successResponse(jsonObject("items" to JSONArray()))
                    else -> successResponse(JSONObject())
                }
            }

        val first = engine.getWallets()
        assertTrue(first.isEmpty(), "Expected no wallets while testing auto-init")
        assertTrue(getPrivateField<Boolean>(engine, "isWalletKitInitialized"))

        val second = engine.getWallets()
        assertTrue(second.isEmpty(), "Subsequent calls should continue to succeed")
        assertEquals(1, initCallCount, "Auto-init should execute exactly once")
    }

    @Test
    fun `explicit init uses provided configuration`() = runTest {
        var capturedPayload: JSONObject? = null
        val engine =
            createEngine { _, method, payload ->
                when (method) {
                    "init" -> {
                        capturedPayload = payload?.let(::JSONObject)
                        successResponse(jsonObject("ok" to true))
                    }
                    else -> successResponse(JSONObject())
                }
            }

        val customConfig =
            WalletKitBridgeConfig(
                network = "mainnet",
                tonApiUrl = "https://tonapi.io",
                bridgeUrl = "https://bridge.example",
                bridgeName = "custom",
                allowMemoryStorage = false,
            )

        engine.init(customConfig)

        val payload =
            capturedPayload ?: fail("Expected init payload to be captured for verification")
        assertEquals("mainnet", payload.optString("network"))
        assertEquals("https://tonapi.io", payload.optString("tonApiUrl"))
        assertEquals("https://bridge.example", payload.optString("bridgeUrl"))
        assertEquals("custom", payload.optString("bridgeName"))
        assertFalse(payload.optBoolean("allowMemoryStorage", true))
        assertTrue(getPrivateField<Boolean>(engine, "isWalletKitInitialized"))
    }

    @Test
    fun `concurrent calls initialize only once`() = runTest {
        var initCalls = 0
        val engine =
            createEngine { _, method, _ ->
                when (method) {
                    "init" -> {
                        initCalls++
                        successResponse(jsonObject("ok" to true))
                    }
                    "getWallets" -> successResponse(jsonObject("items" to JSONArray()))
                    "listSessions" -> successResponse(JSONArray())
                    else -> successResponse(JSONObject())
                }
            }

        val walletsDeferred = async { engine.getWallets() }
        val sessionsDeferred = async { engine.listSessions() }
        val secondWalletsDeferred = async { engine.getWallets() }

        assertTrue(walletsDeferred.await().isEmpty())
        assertTrue(sessionsDeferred.await().isEmpty())
        assertTrue(secondWalletsDeferred.await().isEmpty())

        assertEquals(1, initCalls, "init() should only be invoked once across concurrent callers")
        assertTrue(getPrivateField<Boolean>(engine, "isWalletKitInitialized"))
    }

    @Test
    fun `failed init keeps engine in uninitialized state`() = runTest {
        var initAttempts = 0
        var shouldFail = true
        val engine =
            createEngine { callId, method, _ ->
                when (method) {
                    "init" -> {
                        initAttempts++
                        if (shouldFail) {
                            shouldFail = false
                            errorResponse("boom")
                        } else {
                            successResponse(jsonObject("ok" to true))
                        }
                    }
                    "getWallets" -> successResponse(jsonObject("items" to JSONArray()))
                    else -> successResponse(JSONObject())
                }
            }

        val firstAttempt = runCatching { engine.getWallets() }
        assertTrue(firstAttempt.isFailure, "First call should fail when init throws")
        assertTrue(firstAttempt.exceptionOrNull() is WalletKitBridgeException)
        assertFalse(getPrivateField<Boolean>(engine, "isWalletKitInitialized"))

        val wallets = engine.getWallets()
        assertTrue(wallets.isEmpty(), "Second attempt should succeed after retry")
        assertEquals(2, initAttempts, "Auto-init should retry after failure")
        assertTrue(getPrivateField<Boolean>(engine, "isWalletKitInitialized"))
    }

    private fun createEngine(
        responseProvider: (callId: String, method: String, payloadJson: String?) -> JSONObject,
    ): WebViewWalletKitEngine {
        val engine = WebViewWalletKitEngine(context)
        flushMainThread()
        setPrivateField(engine, "webView", createWebViewStub(engine, responseProvider))
        completeReady(engine)
        return engine
    }

    private fun createWebViewStub(
        engine: WebViewWalletKitEngine,
        responseProvider: (callId: String, method: String, payloadJson: String?) -> JSONObject,
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

    private fun successResponse(result: Any): JSONObject = JSONObject().apply { put("result", result) }

    private fun errorResponse(message: String): JSONObject = JSONObject().apply {
        put("error", JSONObject().apply { put("message", message) })
    }

    private fun jsonObject(vararg entries: Pair<String, Any>): JSONObject = JSONObject().apply {
        entries.forEach { (key, value) -> put(key, value) }
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
        response: JSONObject,
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
        val payload =
            when {
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

    @Suppress("UNCHECKED_CAST")
    private fun <T> getPrivateField(instance: Any, fieldName: String): T {
        val field = instance::class.java.getDeclaredField(fieldName)
        field.isAccessible = true
        return field.get(instance) as T
    }

    private fun setPrivateField(instance: Any, fieldName: String, value: Any) {
        val field = instance::class.java.getDeclaredField(fieldName)
        field.isAccessible = true
        field.set(instance, value)
    }
}
