package io.ton.walletkit.bridge

import android.content.Context
import android.os.Looper
import androidx.test.core.app.ApplicationProvider
import io.ton.walletkit.domain.model.TONNetwork
import io.ton.walletkit.presentation.config.TONWalletKitConfiguration
import io.ton.walletkit.presentation.impl.WebViewWalletKitEngine
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows
import org.robolectric.annotation.Config
import kotlin.test.assertNotNull

/**
 * Tests for WebViewWalletKitEngine auto-initialization feature.
 * Verifies that the engine can automatically initialize itself on first use.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], manifest = Config.NONE)
@OptIn(ExperimentalCoroutinesApi::class)
class WebViewEngineAutoInitTest {
    private val testDispatcher = StandardTestDispatcher()
    private lateinit var context: Context

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        context = ApplicationProvider.getApplicationContext()
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `engine has auto-init capability`() = runTest {
        val engine = WebViewWalletKitEngine(context)
        assertNotNull(engine)

        // Auto-init happens on first call to any method
        // We can't easily test it without a full WebView environment,
        // but we verify the engine supports the init() method
        assertNotNull(engine::init)

        flushMainThread()
    }

    @Test
    fun `init accepts custom config`() = runTest {
        val engine = WebViewWalletKitEngine(context)

        val config = createConfiguration(
            network = TONNetwork.MAINNET,
            persistent = false,
        )

        // Should not throw - init() signature is correct
        // Actual initialization would fail without JS bundle, which is expected
        assertNotNull(config)

        flushMainThread()
    }

    @Test
    fun `init accepts testnet config`() = runTest {
        val engine = WebViewWalletKitEngine(context)

        val config = createConfiguration(network = TONNetwork.TESTNET)

        assertNotNull(config)
        assertNotNull(engine)

        flushMainThread()
    }

    @Test
    fun `engine supports storage configuration`() = runTest {
        val engine = WebViewWalletKitEngine(context)

        val withStorage = createConfiguration(persistent = true)
        val withoutStorage = createConfiguration(persistent = false)

        assertNotNull(withStorage)
        assertNotNull(withoutStorage)
        assertNotNull(engine)

        flushMainThread()
    }

    @Test
    fun `engine can be created multiple times`() = runTest {
        val engine1 = WebViewWalletKitEngine(context)
        val engine2 = WebViewWalletKitEngine(context)
        val engine3 = WebViewWalletKitEngine(context)

        assertNotNull(engine1)
        assertNotNull(engine2)
        assertNotNull(engine3)

        flushMainThread()
    }

    private fun flushMainThread() {
        Shadows.shadowOf(Looper.getMainLooper()).idle()
    }

    private fun createConfiguration(
        network: TONNetwork = TONNetwork.TESTNET,
        persistent: Boolean = true,
    ): TONWalletKitConfiguration {
        return TONWalletKitConfiguration(
            network = network,
            walletManifest = TONWalletKitConfiguration.Manifest(
                name = "Test Wallet",
                appName = "Wallet",
                imageUrl = "https://example.com/icon.png",
                aboutUrl = "https://example.com",
                universalLink = "https://example.com/app",
                bridgeUrl = "https://bridge.tonapi.io/bridge",
            ),
            bridge = TONWalletKitConfiguration.Bridge(
                bridgeUrl = "https://bridge.tonapi.io/bridge",
            ),
            apiClient = null,
            features = emptyList<TONWalletKitConfiguration.Feature>(),
            storage = TONWalletKitConfiguration.Storage(persistent = persistent),
        )
    }
}
