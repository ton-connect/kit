package io.ton.walletkit.bridge

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import io.ton.walletkit.engine.WalletKitEngine
import io.ton.walletkit.core.WalletKitEngineFactory
import io.ton.walletkit.core.WalletKitEngineKind
import io.ton.walletkit.config.TONWalletKitConfiguration
import io.ton.walletkit.listener.TONBridgeEventsHandler
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

/**
 * Structural tests for [WalletKitEngineFactory]. These tests avoid invoking the suspend
 * [WalletKitEngineFactory.create] implementation because it depends on a fully functional JS bridge
 * which is outside the scope of unit tests.
 */
@RunWith(RobolectricTestRunner::class)
class WalletKitEngineFactoryTest {
    private lateinit var context: Context

    @Before
    fun setUp() {
        context = ApplicationProvider.getApplicationContext()
    }

    @Test
    fun `create method exposes expected signature`() {
        val method =
            WalletKitEngineFactory::class.java.declaredMethods.first {
                it.name == "create" && it.parameterTypes.size == 5
            }

        assertNotNull(method)
        assertEquals(WalletKitEngineKind::class.java, method.parameterTypes[1])
        assertEquals(TONWalletKitConfiguration::class.java, method.parameterTypes[2])
        assertEquals(TONBridgeEventsHandler::class.java, method.parameterTypes[3])
    }

    @Test
    fun `isAvailable returns true for WebView engine`() {
        assertTrue(WalletKitEngineFactory.isAvailable(WalletKitEngineKind.WEBVIEW))
    }

    @Test
    fun `isAvailable returns false for QuickJS when class absent`() {
        @Suppress("DEPRECATION")
        assertFalse(WalletKitEngineFactory.isAvailable(WalletKitEngineKind.QUICKJS))
    }

    @Test
    fun `WalletKitEngineKind exposes both enum values`() {
        val values = WalletKitEngineKind.entries.toTypedArray()
        assertEquals(2, values.size)
        assertTrue(values.contains(WalletKitEngineKind.WEBVIEW))
        @Suppress("DEPRECATION")
        assertTrue(values.contains(WalletKitEngineKind.QUICKJS))
    }

    @Test
    fun `WalletKitEngine interface exposes key API methods`() {
        val methodNames = WalletKitEngine::class.java.methods.map { it.name }.toSet()
        val required =
            setOf(
                "init",
                "addWalletFromMnemonic",
                "derivePublicKeyFromMnemonic",
                "signDataWithMnemonic",
                "getRecentTransactions",
                "sendLocalTransaction",
                "rejectConnect",
                "rejectTransaction",
                "rejectSignData",
                "disconnectSession",
            )
        assertTrue(methodNames.containsAll(required))
    }
}
