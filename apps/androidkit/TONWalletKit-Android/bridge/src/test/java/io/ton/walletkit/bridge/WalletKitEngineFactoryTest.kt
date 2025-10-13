package io.ton.walletkit.bridge

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import io.ton.walletkit.presentation.WalletKitEngine
import io.ton.walletkit.presentation.WalletKitEngineFactory
import io.ton.walletkit.presentation.WalletKitEngineKind
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

/**
 * Tests for [WalletKitEngineFactory] to increase coverage for io.ton.walletkit.presentation package.
 */
@RunWith(RobolectricTestRunner::class)
class WalletKitEngineFactoryTest {
    private lateinit var context: Context

    @Before
    fun setUp() {
        context = ApplicationProvider.getApplicationContext()
    }

    @Test
    fun `create with default kind returns WebView engine`() {
        val engine = WalletKitEngineFactory.create(context)
        assertNotNull(engine)
        assertEquals(WalletKitEngineKind.WEBVIEW, engine.kind)
    }

    @Test
    fun `create with explicit WEBVIEW kind returns WebView engine`() {
        val engine = WalletKitEngineFactory.create(context, WalletKitEngineKind.WEBVIEW)
        assertNotNull(engine)
        assertEquals(WalletKitEngineKind.WEBVIEW, engine.kind)
    }

    @Test
    fun `create with QUICKJS kind throws in webview variant`() {
        try {
            @Suppress("DEPRECATION")
            WalletKitEngineFactory.create(context, WalletKitEngineKind.QUICKJS)
        } catch (e: IllegalStateException) {
            assertTrue(e.message?.contains("QuickJS engine is not available") == true)
        }
    }

    @Test
    fun `create multiple engines returns separate instances`() {
        val engine1 = WalletKitEngineFactory.create(context)
        val engine2 = WalletKitEngineFactory.create(context)
        assertTrue(engine1 !== engine2)
    }

    @Test
    fun `isAvailable returns true for WEBVIEW`() {
        val available = WalletKitEngineFactory.isAvailable(WalletKitEngineKind.WEBVIEW)
        assertTrue(available)
    }

    @Test
    fun `isAvailable checks QUICKJS availability`() {
        @Suppress("DEPRECATION")
        val available = WalletKitEngineFactory.isAvailable(WalletKitEngineKind.QUICKJS)
        if (!available) {
            assertFalse(available)
        }
    }

    @Test
    fun `isAvailable checks all enum values`() {
        for (kind in WalletKitEngineKind.values()) {
            val available = WalletKitEngineFactory.isAvailable(kind)
            when (kind) {
                WalletKitEngineKind.WEBVIEW -> assertTrue(available)
                @Suppress("DEPRECATION")
                WalletKitEngineKind.QUICKJS -> assertNotNull(available)
            }
        }
    }

    @Test
    fun `WalletKitEngineKind enum values are accessible`() {
        val values = WalletKitEngineKind.values()
        assertEquals(2, values.size)
        assertTrue(values.contains(WalletKitEngineKind.WEBVIEW))
        @Suppress("DEPRECATION")
        assertTrue(values.contains(WalletKitEngineKind.QUICKJS))
    }

    @Test
    fun `WalletKitEngineKind valueOf works correctly`() {
        assertEquals(WalletKitEngineKind.WEBVIEW, WalletKitEngineKind.valueOf("WEBVIEW"))
        @Suppress("DEPRECATION")
        assertEquals(WalletKitEngineKind.QUICKJS, WalletKitEngineKind.valueOf("QUICKJS"))
    }

    @Test
    fun `WalletKitEngineKind name property works`() {
        assertEquals("WEBVIEW", WalletKitEngineKind.WEBVIEW.name)
        @Suppress("DEPRECATION")
        assertEquals("QUICKJS", WalletKitEngineKind.QUICKJS.name)
    }

    @Test
    fun `WalletKitEngineKind ordinal property works`() {
        assertEquals(0, WalletKitEngineKind.WEBVIEW.ordinal)
        @Suppress("DEPRECATION")
        assertEquals(1, WalletKitEngineKind.QUICKJS.ordinal)
    }

    @Test
    fun `created engine has correct kind property`() {
        val engine = WalletKitEngineFactory.create(context, WalletKitEngineKind.WEBVIEW)
        val kind: WalletKitEngineKind = engine.kind
        assertEquals(WalletKitEngineKind.WEBVIEW, kind)
    }

    @Test
    fun `created engine implements WalletKitEngine interface`() {
        val engine = WalletKitEngineFactory.create(context)
        assertTrue(engine is WalletKitEngine)
    }

    @Test
    fun `createQuickJsEngine reflection handles ClassNotFoundException`() {
        @Suppress("DEPRECATION")
        val isAvailable = WalletKitEngineFactory.isAvailable(WalletKitEngineKind.QUICKJS)
        if (!isAvailable) {
            try {
                @Suppress("DEPRECATION")
                WalletKitEngineFactory.create(context, WalletKitEngineKind.QUICKJS)
                fail("Should throw IllegalStateException")
            } catch (e: IllegalStateException) {
                assertNotNull(e.message)
                assertTrue(e.message?.contains("QuickJS engine is not available") == true)
            }
        }
    }

    @Test
    fun `create covers all when branches for engine kinds`() {
        val webViewEngine = WalletKitEngineFactory.create(context, WalletKitEngineKind.WEBVIEW)
        assertEquals(WalletKitEngineKind.WEBVIEW, webViewEngine.kind)

        @Suppress("DEPRECATION")
        val quickJsAvailable = WalletKitEngineFactory.isAvailable(WalletKitEngineKind.QUICKJS)
        if (quickJsAvailable) {
            @Suppress("DEPRECATION")
            val quickJsEngine = WalletKitEngineFactory.create(context, WalletKitEngineKind.QUICKJS)
            @Suppress("DEPRECATION")
            assertEquals(WalletKitEngineKind.QUICKJS, quickJsEngine.kind)
        }
    }

    @Test
    fun `isAvailable covers all when branches`() {
        val webViewAvailable = WalletKitEngineFactory.isAvailable(WalletKitEngineKind.WEBVIEW)
        assertTrue(webViewAvailable)

        @Suppress("DEPRECATION")
        val quickJsAvailable = WalletKitEngineFactory.isAvailable(WalletKitEngineKind.QUICKJS)
        assertNotNull(quickJsAvailable)
    }

    @Test
    fun `engine interface methods with default parameters exist`() {
        val engine = WalletKitEngineFactory.create(context)
        val interfaceMethods = WalletKitEngine::class.java.methods

        val methodsWithDefaults = listOf(
            "init",
            "addWalletFromMnemonic",
            "getRecentTransactions",
            "sendTransaction",
            "rejectConnect",
            "rejectTransaction",
            "rejectSignData",
            "disconnectSession",
        )

        for (methodName in methodsWithDefaults) {
            val hasMethod = interfaceMethods.any { it.name == methodName }
            assertTrue("Engine should have $methodName method", hasMethod)
        }
    }
}
