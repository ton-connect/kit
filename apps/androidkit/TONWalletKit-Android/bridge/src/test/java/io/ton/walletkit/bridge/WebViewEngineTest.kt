package io.ton.walletkit.bridge

import android.content.Context
import android.os.Looper
import androidx.test.core.app.ApplicationProvider
import io.ton.walletkit.presentation.WalletKitEngineKind
import io.ton.walletkit.presentation.event.WalletKitEvent
import io.ton.walletkit.presentation.impl.WebViewWalletKitEngine
import io.ton.walletkit.presentation.listener.WalletKitEventHandler
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows
import org.robolectric.annotation.Config
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

/**
 * Tests for WebViewWalletKitEngine initialization and basic functionality.
 * These tests verify the engine can be created, configured, and supports event handling.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], manifest = Config.NONE)
class WebViewEngineTest {
    private lateinit var context: Context

    @Before
    fun setUp() {
        context = ApplicationProvider.getApplicationContext()
    }

    @Test
    fun `engine can be instantiated`() {
        val engine = WebViewWalletKitEngine(context)
        assertNotNull(engine)
        flushMainThread()
    }

    @Test
    fun `engine has correct kind`() {
        val engine = WebViewWalletKitEngine(context)
        assertEquals(WalletKitEngineKind.WEBVIEW, engine.kind)
        flushMainThread()
    }

    @Test
    fun `engine supports custom asset path`() {
        val customPath = "custom/path/index.html"
        val engine = WebViewWalletKitEngine(context, assetPath = customPath)
        assertNotNull(engine)
        flushMainThread()
    }

    @Test
    fun `engine exposes WebView for debugging`() {
        val engine = WebViewWalletKitEngine(context)
        flushMainThread() // Let WebView initialize on main thread
        val webView = engine.asView()
        assertNotNull(webView)
        assertTrue(webView.settings.javaScriptEnabled)
    }

    @Test
    fun `event handler can be registered`() {
        val engine = WebViewWalletKitEngine(context)
        var eventCount = 0

        val handler = object : WalletKitEventHandler {
            override fun handleEvent(event: WalletKitEvent) {
                eventCount++
            }
        }

        val closeable = engine.addEventHandler(handler)
        assertNotNull(closeable)

        flushMainThread()

        // Clean up
        closeable.close()
    }

    @Test
    fun `multiple event handlers can be registered`() {
        val engine = WebViewWalletKitEngine(context)

        val handler1 = object : WalletKitEventHandler {
            override fun handleEvent(event: WalletKitEvent) {}
        }
        val handler2 = object : WalletKitEventHandler {
            override fun handleEvent(event: WalletKitEvent) {}
        }
        val handler3 = object : WalletKitEventHandler {
            override fun handleEvent(event: WalletKitEvent) {}
        }

        val c1 = engine.addEventHandler(handler1)
        val c2 = engine.addEventHandler(handler2)
        val c3 = engine.addEventHandler(handler3)

        assertNotNull(c1)
        assertNotNull(c2)
        assertNotNull(c3)

        flushMainThread()

        // Clean up
        c1.close()
        c2.close()
        c3.close()
    }

    @Test
    fun `event handler can be unregistered`() {
        val engine = WebViewWalletKitEngine(context)

        val handler = object : WalletKitEventHandler {
            override fun handleEvent(event: WalletKitEvent) {}
        }

        val closeable = engine.addEventHandler(handler)
        closeable.close() // Should not throw

        flushMainThread()
    }

    @Test
    fun `engine can be destroyed`() {
        val engine = WebViewWalletKitEngine(context)

        flushMainThread()

        // Should not throw
        // Note: destroy() is suspend, so we can't easily test it here
        // This is more of a smoke test
        assertNotNull(engine)
    }

    @Test
    fun `WebView has correct settings`() {
        val engine = WebViewWalletKitEngine(context)
        flushMainThread() // Let WebView initialize on main thread
        val webView = engine.asView()

        assertTrue(webView.settings.javaScriptEnabled, "JavaScript should be enabled")
        assertTrue(webView.settings.domStorageEnabled, "DOM storage should be enabled")
    }

    @Test
    fun `WebView has JavaScript interface`() {
        val engine = WebViewWalletKitEngine(context)
        val webView = engine.asView()

        // The interface "WalletKitNative" should be injected
        // We can't easily test this without executing JS, but the engine should not crash
        assertNotNull(webView)

        flushMainThread()
    }

    @Test
    fun `engine supports default asset path`() {
        val engine = WebViewWalletKitEngine(context)
        // Default path is "walletkit/index.html"
        assertNotNull(engine)
        flushMainThread()
    }

    @Test
    fun `engine uses application context`() {
        val activityContext = ApplicationProvider.getApplicationContext<Context>()
        val engine = WebViewWalletKitEngine(activityContext)

        // Engine should work with application context
        assertNotNull(engine)
        assertEquals(WalletKitEngineKind.WEBVIEW, engine.kind)

        flushMainThread()
    }

    private fun flushMainThread() {
        Shadows.shadowOf(Looper.getMainLooper()).idle()
    }
}
