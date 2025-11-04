package io.ton.walletkit.bridge

import android.content.Context
import android.os.Looper
import androidx.test.core.app.ApplicationProvider
import io.ton.walletkit.config.TONWalletKitConfiguration
import io.ton.walletkit.impl.WebViewWalletKitEngine
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows
import org.robolectric.annotation.Config
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

/**
 * Tests for WebViewWalletKitEngine API surface.
 * Verifies that all public methods from WalletKitEngine interface are implemented.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], manifest = Config.NONE)
class WebViewEngineApiTest {
    private lateinit var context: Context
    private lateinit var configuration: TONWalletKitConfiguration
    private lateinit var engine: WebViewWalletKitEngine

    @Before
    fun setUp() {
        context = ApplicationProvider.getApplicationContext()
        configuration = testWalletKitConfiguration()
        engine = WebViewWalletKitEngine(context, configuration, NoopEventsHandler)
        flushMainThread()
    }

    @Test
    fun `engine implements init method`() {
        assertNotNull(engine::init)
    }

    @Test
    fun `engine implements addWalletFromMnemonic method`() {
        assertNotNull(engine::addWalletFromMnemonic)
    }

    @Test
    fun `engine implements derivePublicKeyFromMnemonic method`() {
        assertNotNull(engine::derivePublicKeyFromMnemonic)
    }

    @Test
    fun `engine implements signDataWithMnemonic method`() {
        assertNotNull(engine::signDataWithMnemonic)
    }

    @Test
    fun `engine implements getWallets method`() {
        assertNotNull(engine::getWallets)
    }

    @Test
    fun `engine implements removeWallet method`() {
        assertNotNull(engine::removeWallet)
    }

    @Test
    fun `engine implements getWalletState method`() {
        assertNotNull(engine::getWalletState)
    }

    @Test
    fun `engine implements getRecentTransactions method`() {
        assertNotNull(engine::getRecentTransactions)
    }

    @Test
    fun `engine implements handleTonConnectUrl method`() {
        assertNotNull(engine::handleTonConnectUrl)
    }

    @Test
    fun `engine implements sendLocalTransaction method`() {
        assertNotNull(engine::sendLocalTransaction)
    }

    @Test
    fun `engine implements approveConnect method`() {
        assertNotNull(engine::approveConnect)
    }

    @Test
    fun `engine implements rejectConnect method`() {
        assertNotNull(engine::rejectConnect)
    }

    @Test
    fun `engine implements approveTransaction method`() {
        assertNotNull(engine::approveTransaction)
    }

    @Test
    fun `engine implements rejectTransaction method`() {
        assertNotNull(engine::rejectTransaction)
    }

    @Test
    fun `engine implements approveSignData method`() {
        assertNotNull(engine::approveSignData)
    }

    @Test
    fun `engine implements rejectSignData method`() {
        assertNotNull(engine::rejectSignData)
    }

    @Test
    fun `engine implements listSessions method`() {
        assertNotNull(engine::listSessions)
    }

    @Test
    fun `engine implements disconnectSession method`() {
        assertNotNull(engine::disconnectSession)
    }

    @Test
    fun `engine implements destroy method`() {
        assertNotNull(engine::destroy)
    }

    @Test
    fun `all core wallet operations are present`() {
        val methods = listOf(
            engine::init,
            engine::addWalletFromMnemonic,
            engine::getWallets,
            engine::removeWallet,
            engine::getWalletState,
            engine::getRecentTransactions,
        )

        assertTrue(methods.all { it != null })
    }

    @Test
    fun `all TonConnect operations are present`() {
        val methods = listOf(
            engine::handleTonConnectUrl,
            engine::approveConnect,
            engine::rejectConnect,
            engine::approveTransaction,
            engine::rejectTransaction,
            engine::approveSignData,
            engine::rejectSignData,
            engine::listSessions,
            engine::disconnectSession,
        )

        assertTrue(methods.all { it != null })
    }

    @Test
    fun `engine has WebView-specific methods`() {
        // These are WebView-specific, not in base interface
        assertNotNull(engine::asView)
        assertNotNull(engine::attachTo)
    }

    private fun flushMainThread() {
        Shadows.shadowOf(Looper.getMainLooper()).idle()
    }
}
