package io.ton.walletkit.bridge

import android.content.Context
import android.webkit.ValueCallback
import android.webkit.WebView
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import io.ton.walletkit.domain.constants.WebViewConstants
import io.ton.walletkit.domain.model.TONNetwork
import io.ton.walletkit.presentation.WalletKitEngine
import io.ton.walletkit.presentation.WalletKitEngineFactory
import io.ton.walletkit.presentation.WalletKitEngineKind
import io.ton.walletkit.presentation.config.TONWalletKitConfiguration
import junit.framework.TestCase.assertTrue
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Verifies that the WebView-based WalletKit engine loads the bundled bridge script.
 * We reflect the internal WebView and evaluate a script to check for bridge readiness.
 */
@RunWith(AndroidJUnit4::class)
class WebViewTonConnectInstrumentedTest {

    private lateinit var context: Context
    private lateinit var configuration: TONWalletKitConfiguration
    private lateinit var engine: WalletKitEngine

    @Before
    fun setUp(): Unit = runBlocking {
        context = ApplicationProvider.getApplicationContext()
        configuration = createConfiguration()
        engine = WalletKitEngineFactory.create(
            context = context,
            kind = WalletKitEngineKind.WEBVIEW,
            configuration = configuration,
            eventsHandler = RecordingEventsHandler(),
        )
    }

    @After
    fun tearDown(): Unit = runBlocking {
        engine.destroy()
    }

    @Test
    fun bundleIsLoadedInWebView(): Unit = runBlocking {
        val webView = extractWebView(engine)
        val evaluation = CompletableDeferred<Boolean>()

        InstrumentationRegistry.getInstrumentation().runOnMainSync {
            webView.evaluateJavascript(
                "(typeof window.__walletkitCall === 'function')",
                ValueCallback { result ->
                    evaluation.complete(result?.trim()?.trim('"')?.equals("true", ignoreCase = true) == true)
                },
            )
        }

        val isBridgeReady = withTimeout(5_000) { evaluation.await() }
        assertTrue("WalletKit bridge script should be loaded in WebView", isBridgeReady)
    }

    private fun extractWebView(engine: WalletKitEngine): WebView {
        val field = engine.javaClass.getDeclaredField("webView")
        field.isAccessible = true
        return field.get(engine) as WebView
    }

    private fun createConfiguration(): TONWalletKitConfiguration {
        return TONWalletKitConfiguration(
            network = TONNetwork.MAINNET,
            walletManifest = TONWalletKitConfiguration.Manifest(
                name = "Instrumented Wallet",
                appName = "Wallet",
                imageUrl = "https://wallet.example/icon.png",
                aboutUrl = "https://wallet.example/about",
                universalLink = "https://wallet.example/app",
                bridgeUrl = "https://bridge.tonapi.io/bridge",
            ),
            bridge = TONWalletKitConfiguration.Bridge(
                bridgeUrl = "https://bridge.tonapi.io/bridge"
            ),
            storage = TONWalletKitConfiguration.Storage(persistent = true),
            features = emptyList(),
        )
    }

    private class RecordingEventsHandler : io.ton.walletkit.presentation.listener.TONBridgeEventsHandler {
        override fun handle(event: io.ton.walletkit.presentation.event.TONWalletKitEvent) {
            // No-op for this test
        }
    }
}
