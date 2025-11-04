package io.ton.walletkit.bridge

import android.content.Context
import android.webkit.ValueCallback
import android.webkit.WebView
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import io.ton.walletkit.data.storage.impl.SecureWalletKitStorage
import io.ton.walletkit.domain.constants.StorageConstants
import io.ton.walletkit.domain.model.TONNetwork
import io.ton.walletkit.presentation.WalletKitEngine
import io.ton.walletkit.presentation.WalletKitEngineFactory
import io.ton.walletkit.presentation.WalletKitEngineKind
import io.ton.walletkit.presentation.config.SignDataType
import io.ton.walletkit.presentation.config.TONWalletKitConfiguration
import io.ton.walletkit.presentation.event.TONWalletKitEvent
import io.ton.walletkit.presentation.listener.TONBridgeEventsHandler
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import org.json.JSONObject
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class DurableEventReplayInstrumentedTest {

    private lateinit var context: Context
    private lateinit var configuration: TONWalletKitConfiguration
    private lateinit var eventsHandler: RecordingEventsHandler
    private lateinit var engine: WalletKitEngine
    private lateinit var storage: SecureWalletKitStorage

    @Before
    fun setUp() = runBlocking {
        context = ApplicationProvider.getApplicationContext()
        configuration = createConfiguration()
        eventsHandler = RecordingEventsHandler()
        storage = SecureWalletKitStorage(context, StorageConstants.BRIDGE_STORAGE_NAME)
        storage.clearBridgeData()
        engine = WalletKitEngineFactory.create(
            context = context,
            kind = WalletKitEngineKind.WEBVIEW,
            configuration = configuration,
            eventsHandler = eventsHandler,
        )
        waitForBridgeReady()
        aliasNativeStorage()
        installNoOpEventListeners()
    }

    @After
    fun tearDown() = runBlocking {
        engine.destroy()
        storage.clearBridgeData()
    }

    @Test
    fun connectEventPersistsUntilListenersRegistered() = runBlocking {
        val webView = extractWebView(engine)
        val tonConnectUrl = buildTonConnectUrl()

        // Inject TonConnect event before registering listeners
        evaluateJavascript(webView, "window.walletkitBridge.handleTonConnectUrl({ url: '$tonConnectUrl' });")

        val storedBefore = waitForDurableEvents()
        assertTrue("Durable events should contain the connect request", storedBefore.isNotEmpty())
        val firstStatus = storedBefore.values.first().optString("status")
        assertEquals("new", firstStatus)

        // Restore real listeners so stored events replay to native handler
        restoreEventListeners()

        withTimeout(10_000) {
            while (eventsHandler.events.none { it is TONWalletKitEvent.ConnectRequest }) {
                InstrumentationRegistry.getInstrumentation().waitForIdleSync()
                delay(50)
            }
        }

        // Ensure durable events marked completed after replay
        withTimeout(5_000) {
            while (loadDurableEvents().values.any { it.optString("status") != "completed" }) {
                delay(100)
            }
        }
        val storedAfter = loadDurableEvents()
        assertTrue(storedAfter.values.all { it.optString("status") == "completed" })
    }

    private fun buildTonConnectUrl(): String {
        val payload =
            JSONObject()
                .put("manifestUrl", "https://wallet.example/tonconnect-manifest.json")
                .put("items", org.json.JSONArray())
        val encoded = java.net.URLEncoder.encode(payload.toString(), Charsets.UTF_8.name())
        return "ton://connect?v=2&id=durable-event-test&r=$encoded"
    }

    private fun createConfiguration(): TONWalletKitConfiguration {
        return TONWalletKitConfiguration(
            network = TONNetwork.MAINNET,
            walletManifest = TONWalletKitConfiguration.Manifest(
                name = "Instrumented Wallet",
                appName = "Wallet",
                imageUrl = "https://wallet.example/icon.png",
                aboutUrl = "https://wallet.example/about",
                universalLink = "https://wallet.ton.org/tc",
                bridgeUrl = "https://bridge.tonapi.io/bridge",
            ),
            bridge = TONWalletKitConfiguration.Bridge(bridgeUrl = "https://bridge.tonapi.io/bridge"),
            storage = TONWalletKitConfiguration.Storage(persistent = true),
            apiClient = null,
            features = listOf(
                TONWalletKitConfiguration.SendTransactionFeature(maxMessages = 4),
                TONWalletKitConfiguration.SignDataFeature(
                    types = listOf(SignDataType.TEXT, SignDataType.BINARY, SignDataType.CELL),
                ),
            ),
        )
    }

    private fun extractWebView(engine: WalletKitEngine): WebView {
        val field = engine.javaClass.getDeclaredField("webView")
        field.isAccessible = true
        return field.get(engine) as WebView
    }

    private suspend fun waitForBridgeReady() {
        val webView = extractWebView(engine)
        withTimeout(10_000) {
            while (evaluateJavascript(webView, "(typeof window.walletkitBridge === 'object')")?.contains("true") != true) {
                delay(50)
            }
        }
    }

    private suspend fun aliasNativeStorage() {
        val webView = extractWebView(engine)
        evaluateJavascript(webView, "window.Android = window.WalletKitNative; 'ok';")
    }

    private suspend fun installNoOpEventListeners() {
        val webView = extractWebView(engine)
        evaluateJavascript(
            webView,
            """
            (function(){
              if (!window.__originalSetEventsListeners) {
                window.__originalSetEventsListeners = window.walletkitBridge.setEventsListeners;
              }
              window.walletkitBridge.setEventsListeners = function(){ return { ok: true }; };
              return 'ok';
            })();
            """.trimIndent(),
        )
    }

    private suspend fun restoreEventListeners() {
        val webView = extractWebView(engine)
        evaluateJavascript(
            webView,
            """
            (function(){
              if (window.__originalSetEventsListeners) {
                window.walletkitBridge.setEventsListeners = window.__originalSetEventsListeners;
              }
              return window.walletkitBridge.setEventsListeners();
            })();
            """.trimIndent(),
        )
    }

    private suspend fun evaluateJavascript(webView: WebView, script: String): String? {
        val deferred = CompletableDeferred<String?>()
        InstrumentationRegistry.getInstrumentation().runOnMainSync {
            webView.evaluateJavascript(script, ValueCallback { result -> deferred.complete(result) })
        }
        return deferred.await()
    }

    private suspend fun waitForDurableEvents(): Map<String, JSONObject> {
        withTimeout(15_000) {
            while (loadDurableEvents().isEmpty()) {
                delay(100)
            }
        }
        return loadDurableEvents()
    }

    private suspend fun loadDurableEvents(): Map<String, JSONObject> {
        val raw = storage.getRawValue(StorageConstants.KEY_PREFIX_BRIDGE + "durable_events")
        if (raw.isNullOrEmpty()) return emptyMap()
        val json = JSONObject(raw)
        val result = mutableMapOf<String, JSONObject>()
        json.keys().forEach { key ->
            result[key] = json.getJSONObject(key)
        }
        return result
    }

    private class RecordingEventsHandler : TONBridgeEventsHandler {
        private val mutableEvents = mutableListOf<TONWalletKitEvent>()
        val events: List<TONWalletKitEvent> get() = mutableEvents
        override fun handle(event: TONWalletKitEvent) {
            mutableEvents += event
        }
    }
}
