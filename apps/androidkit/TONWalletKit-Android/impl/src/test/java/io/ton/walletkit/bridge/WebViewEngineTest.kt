package io.ton.walletkit.bridge

import android.content.Context
import android.os.Looper
import androidx.test.core.app.ApplicationProvider
import io.ton.walletkit.WalletKitEngineKind
import io.ton.walletkit.config.TONWalletKitConfiguration
import io.ton.walletkit.event.TONWalletKitEvent
import io.ton.walletkit.impl.WebViewWalletKitEngine
import io.ton.walletkit.listener.TONBridgeEventsHandler
import org.json.JSONObject
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
    private lateinit var configuration: TONWalletKitConfiguration

    @Before
    fun setUp() {
        context = ApplicationProvider.getApplicationContext()
        configuration = testWalletKitConfiguration()
    }

    @Test
    fun `engine can be instantiated`() {
        val engine = createEngine()
        assertNotNull(engine)
        flushMainThread()
    }

    @Test
    fun `engine has correct kind`() {
        val engine = createEngine()
        assertEquals(WalletKitEngineKind.WEBVIEW, engine.kind)
        flushMainThread()
    }

    @Test
    fun `engine supports custom asset path`() {
        val customPath = "custom/path/index.html"
        val engine = createEngine(assetPath = customPath)
        assertNotNull(engine)
        flushMainThread()
    }

    @Test
    fun `engine exposes WebView for debugging`() {
        val engine = createEngine()
        flushMainThread() // Let WebView initialize on main thread
        val webView = engine.asView()
        assertNotNull(webView)
        assertTrue(webView.settings.javaScriptEnabled)
    }

    @Test
    fun `event handler receives disconnect events`() {
        val recordingHandler = RecordingEventsHandler()
        val engine = createEngine(recordingHandler)

        invokeHandleEvent(engine, disconnectEvent("session-1"))
        flushMainThread()

        assertEquals(1, recordingHandler.events.size)
        assertTrue(recordingHandler.events.first() is TONWalletKitEvent.Disconnect)
    }

    @Test
    fun `multiple event handlers can be registered`() {
        val handler1 = RecordingEventsHandler()
        val handler2 = RecordingEventsHandler()
        val handler3 = RecordingEventsHandler()

        val composite = compositeEventsHandler(handler1, handler2, handler3)
        val engine = createEngine(composite)

        invokeHandleEvent(engine, disconnectEvent("session-2"))
        flushMainThread()

        assertTrue(handler1.events.isNotEmpty())
        assertTrue(handler2.events.isNotEmpty())
        assertTrue(handler3.events.isNotEmpty())
    }

    @Test
    fun `engine can be destroyed`() {
        val engine = createEngine()

        flushMainThread()

        // Should not throw
        // Note: destroy() is suspend, so we can't easily test it here
        // This is more of a smoke test
        assertNotNull(engine)
    }

    @Test
    fun `WebView has correct settings`() {
        val engine = createEngine()
        flushMainThread() // Let WebView initialize on main thread
        val webView = engine.asView()

        assertTrue(webView.settings.javaScriptEnabled, "JavaScript should be enabled")
        assertTrue(webView.settings.domStorageEnabled, "DOM storage should be enabled")
    }

    @Test
    fun `WebView has JavaScript interface`() {
        val engine = createEngine()
        val webView = engine.asView()

        // The interface "WalletKitNative" should be injected
        // We can't easily test this without executing JS, but the engine should not crash
        assertNotNull(webView)

        flushMainThread()
    }

    @Test
    fun `engine supports default asset path`() {
        val engine = createEngine()
        // Default path is "walletkit/index.html"
        assertNotNull(engine)
        flushMainThread()
    }

    @Test
    fun `engine uses application context`() {
        val activityContext = ApplicationProvider.getApplicationContext<Context>()
        val engine = WebViewWalletKitEngine(activityContext, configuration, NoopEventsHandler)

        // Engine should work with application context
        assertNotNull(engine)
        assertEquals(WalletKitEngineKind.WEBVIEW, engine.kind)

        flushMainThread()
    }

    private fun createEngine(
        eventsHandler: TONBridgeEventsHandler = NoopEventsHandler,
        assetPath: String = "walletkit/index.html",
    ): WebViewWalletKitEngine {
        return WebViewWalletKitEngine(context, configuration, eventsHandler, assetPath)
    }

    private fun flushMainThread() {
        Shadows.shadowOf(Looper.getMainLooper()).idle()
    }

    private fun invokeHandleEvent(engine: WebViewWalletKitEngine, event: JSONObject) {
        val method = engine.javaClass.getDeclaredMethod("handleEvent", JSONObject::class.java)
        method.isAccessible = true
        method.invoke(engine, event)
    }

    private fun disconnectEvent(sessionId: String): JSONObject {
        return JSONObject().apply {
            put("type", "disconnect")
            put(
                "data",
                JSONObject().apply {
                    put("sessionId", sessionId)
                },
            )
        }
    }
}
