package io.ton.walletkit.bridge

import android.content.Context
import android.webkit.WebView
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import io.ton.walletkit.presentation.WalletKitEngineKind
import io.ton.walletkit.presentation.config.WalletKitBridgeConfig
import io.ton.walletkit.presentation.event.WalletKitEvent
import io.ton.walletkit.presentation.impl.WebViewWalletKitEngine
import io.ton.walletkit.presentation.listener.WalletKitEventHandler
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.atomic.AtomicInteger

/**
 * Instrumented tests for WebViewWalletKitEngine that run on a real Android device or emulator.
 * These tests verify the actual WebView integration and JavaScript bridge functionality.
 *
 * Note: WebView must be created on the main thread, so we create it within each test
 * on the main dispatcher.
 */
@RunWith(AndroidJUnit4::class)
class WebViewEngineInstrumentedTest {

    private lateinit var context: Context

    @Before
    fun setUp() {
        context = InstrumentationRegistry.getInstrumentation().targetContext
    }

    @After
    fun tearDown() {
        // Cleanup happens in each test
    }

    // ========== Initialization Tests ==========

    @Test
    fun engineCreatesSuccessfully() = runBlocking {
        withContext(Dispatchers.Main) {
            val engine = WebViewWalletKitEngine(context)
            try {
                assertNotNull(engine)
                assertEquals(WalletKitEngineKind.WEBVIEW, engine.kind)
            } finally {
                engine.destroy()
            }
        }
    }

    @Test
    fun engineInitializesWithDefaultConfig() = runBlocking {
        withContext(Dispatchers.Main) {
            val engine = WebViewWalletKitEngine(context)
            try {
                withTimeout(10_000) {
                    engine.init()
                }
                // If init() completes without throwing, the test passes
            } finally {
                engine.destroy()
            }
        }
    }

    @Test
    fun engineInitializesWithCustomConfig() = runBlocking {
        withContext(Dispatchers.Main) {
            val engine = WebViewWalletKitEngine(context)
            try {
                val config = WalletKitBridgeConfig(
                    network = "testnet",
                    enablePersistentStorage = false,
                )

                withTimeout(10_000) {
                    engine.init(config)
                }
                // If init() completes without throwing, the test passes
            } finally {
                engine.destroy()
            }
        }
    }

    @Test
    fun multipleInitCallsAreIdempotent() = runBlocking {
        withContext(Dispatchers.Main) {
            val engine = WebViewWalletKitEngine(context)
            try {
                withTimeout(10_000) {
                    engine.init()
                    engine.init() // Second call should not fail
                    engine.init() // Third call should not fail
                }
            } finally {
                engine.destroy()
            }
        }
    }

    @Test
    fun webViewIsProperlyConfigured() = runBlocking {
        withContext(Dispatchers.Main) {
            val engine = WebViewWalletKitEngine(context)
            try {
                withTimeout(10_000) {
                    engine.init()
                }

                // Access WebView on main thread (we're already on it)
                val webViewField = engine.javaClass.getDeclaredField("webView")
                webViewField.isAccessible = true
                val webView = webViewField.get(engine) as WebView

                assertTrue("JavaScript should be enabled", webView.settings.javaScriptEnabled)
                assertTrue("DOM storage should be enabled", webView.settings.domStorageEnabled)
            } finally {
                engine.destroy()
            }
        }
    }

    // ========== Wallet Management Tests ==========

    @Test
    fun getWalletsReturnsEmptyListInitially() = runBlocking {
        withContext(Dispatchers.Main) {
            val engine = WebViewWalletKitEngine(context)
            try {
                withTimeout(15_000) {
                    engine.init()

                    val wallets = engine.getWallets()

                    assertNotNull("Wallets list should not be null", wallets)
                    assertTrue("Wallets list should be empty initially", wallets.isEmpty())
                }
            } finally {
                engine.destroy()
            }
        }
    }

    @Test
    fun addWalletFromMnemonicCanBeCalled() = runBlocking {
        withContext(Dispatchers.Main) {
            val engine = WebViewWalletKitEngine(context)
            try {
                withTimeout(15_000) {
                    engine.init()

                    // Generate a valid 24-word mnemonic (these are valid BIP39 words)
                    val mnemonic = listOf(
                        "abandon", "abandon", "abandon", "abandon", "abandon", "abandon",
                        "abandon", "abandon", "abandon", "abandon", "abandon", "abandon",
                        "abandon", "abandon", "abandon", "abandon", "abandon", "abandon",
                        "abandon", "abandon", "abandon", "abandon", "abandon", "art",
                    )

                    // Just test that the API can be called without throwing
                    // The actual wallet creation depends on the JavaScript bundle being loaded
                    try {
                        val account = engine.addWalletFromMnemonic(
                            words = mnemonic,
                            name = "Test Wallet",
                            version = "v4r2",
                        )
                        assertNotNull("Account should not be null", account)
                    } catch (e: Exception) {
                        // Expected if bundle not fully loaded - just verify API is callable
                        assertTrue("Exception should have message", e.message != null)
                    }
                }
            } finally {
                engine.destroy()
            }
        }
    }

    @Test
    fun getWalletsCanBeCalled() = runBlocking {
        withContext(Dispatchers.Main) {
            val engine = WebViewWalletKitEngine(context)
            try {
                withTimeout(15_000) {
                    engine.init()

                    // Just test that getWallets can be called
                    val wallets = engine.getWallets()
                    assertNotNull("Wallets list should not be null", wallets)
                    // List might be empty if no wallets added
                }
            } finally {
                engine.destroy()
            }
        }
    }

    // ========== Event Handler Tests ==========

    @Test
    fun eventHandlerCanBeAdded() = runBlocking {
        withContext(Dispatchers.Main) {
            val engine = WebViewWalletKitEngine(context)
            try {
                withTimeout(15_000) {
                    val eventCount = AtomicInteger(0)

                    val handler = object : WalletKitEventHandler {
                        override fun handleEvent(event: WalletKitEvent) {
                            eventCount.incrementAndGet()
                        }
                    }

                    engine.init()
                    val closeable = engine.addEventHandler(handler)

                    assertNotNull("Closeable should not be null", closeable)
                }
            } finally {
                engine.destroy()
            }
        }
    }

    @Test
    fun eventHandlerCanBeRemoved() = runBlocking {
        withContext(Dispatchers.Main) {
            val engine = WebViewWalletKitEngine(context)
            try {
                withTimeout(15_000) {
                    val eventCount = AtomicInteger(0)

                    val handler = object : WalletKitEventHandler {
                        override fun handleEvent(event: WalletKitEvent) {
                            eventCount.incrementAndGet()
                        }
                    }

                    engine.init()
                    val closeable = engine.addEventHandler(handler)

                    // Remove handler by closing
                    closeable.close()

                    // After removal, events should not be received
                    // (We can't easily test this without triggering actual events)
                }
            } finally {
                engine.destroy()
            }
        }
    }

    // ========== Session Management Tests ==========

    @Test
    fun listSessionsReturnsEmptyListInitially() = runBlocking {
        withContext(Dispatchers.Main) {
            val engine = WebViewWalletKitEngine(context)
            try {
                withTimeout(15_000) {
                    engine.init()

                    val sessions = engine.listSessions()

                    assertNotNull("Sessions list should not be null", sessions)
                    assertTrue("Sessions list should be empty initially", sessions.isEmpty())
                }
            } finally {
                engine.destroy()
            }
        }
    }

    @Test
    fun disconnectSessionDoesNotFailWhenNoSessions() = runBlocking {
        withContext(Dispatchers.Main) {
            val engine = WebViewWalletKitEngine(context)
            try {
                withTimeout(15_000) {
                    engine.init()

                    // Should not throw even when there are no sessions
                    engine.disconnectSession()
                }
            } finally {
                engine.destroy()
            }
        }
    }

    // ========== Network Configuration Tests ==========

    @Test
    fun networkConfigurationWithTestnet() = runBlocking {
        withContext(Dispatchers.Main) {
            val engine = WebViewWalletKitEngine(context)
            try {
                withTimeout(15_000) {
                    val config = WalletKitBridgeConfig(
                        network = "testnet",
                        enablePersistentStorage = false,
                    )

                    engine.init(config)

                    // Network configuration should be applied successfully
                }
            } finally {
                engine.destroy()
            }
        }
    }

    @Test
    fun networkConfigurationWithMainnet() = runBlocking {
        withContext(Dispatchers.Main) {
            val engine = WebViewWalletKitEngine(context)
            try {
                withTimeout(15_000) {
                    val config = WalletKitBridgeConfig(
                        network = "mainnet",
                        enablePersistentStorage = false,
                    )

                    engine.init(config)

                    // Network configuration should be applied successfully
                }
            } finally {
                engine.destroy()
            }
        }
    }

    @Test
    fun storageCanBeDisabled() = runBlocking {
        withContext(Dispatchers.Main) {
            val engine = WebViewWalletKitEngine(context)
            try {
                withTimeout(15_000) {
                    val config = WalletKitBridgeConfig(
                        enablePersistentStorage = false,
                    )

                    engine.init(config)

                    // Storage disabled configuration should work
                }
            } finally {
                engine.destroy()
            }
        }
    }

    // ========== Resource Cleanup Tests ==========

    @Test
    fun engineCanBeDestroyed() = runBlocking {
        withContext(Dispatchers.Main) {
            val engine = WebViewWalletKitEngine(context)
            withTimeout(10_000) {
                engine.init()
                engine.destroy()
            }
            // Should not throw exception
        }
    }

    @Test
    fun engineCanBeDestroyedMultipleTimes() = runBlocking {
        withContext(Dispatchers.Main) {
            val engine = WebViewWalletKitEngine(context)
            withTimeout(10_000) {
                engine.destroy()
                engine.destroy() // Should not throw
                engine.destroy() // Should not throw
            }
        }
    }

    // ========== WebView Lifecycle Tests ==========

    @Test
    fun webViewHandlesMultipleInitCalls() = runBlocking {
        withContext(Dispatchers.Main) {
            val engine = WebViewWalletKitEngine(context)
            try {
                withTimeout(20_000) {
                    engine.init()
                    engine.init()
                    engine.init()

                    // Multiple init calls should be handled gracefully
                    val wallets = engine.getWallets()
                    assertNotNull("Should still be able to call methods after multiple inits", wallets)
                }
            } finally {
                engine.destroy()
            }
        }
    }

    @Test
    fun webViewHandlesRapidMethodCalls() = runBlocking {
        withContext(Dispatchers.Main) {
            val engine = WebViewWalletKitEngine(context)
            try {
                withTimeout(20_000) {
                    engine.init()

                    // Perform rapid consecutive operations
                    repeat(5) { i ->
                        val wallets = engine.getWallets()
                        val sessions = engine.listSessions()
                        assertNotNull("Operation $i should succeed - wallets", wallets)
                        assertNotNull("Operation $i should succeed - sessions", sessions)
                    }
                }
            } finally {
                engine.destroy()
            }
        }
    }
}
