package io.ton.walletkit.bridge

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.json.JSONObject
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference

/**
 * Instrumented tests for WebView JavaScript bridge functionality.
 * Tests the low-level WebView-Kotlin communication layer.
 */
@RunWith(AndroidJUnit4::class)
class WebViewJsBridgeInstrumentedTest {

    private lateinit var context: Context
    private lateinit var webView: WebView
    private val mainHandler = Handler(Looper.getMainLooper())

    @Before
    fun setUp() {
        context = InstrumentationRegistry.getInstrumentation().targetContext

        // Create WebView on main thread
        val latch = CountDownLatch(1)
        mainHandler.post {
            webView = WebView(context)
            webView.settings.javaScriptEnabled = true
            latch.countDown()
        }
        assertTrue("WebView should be created", latch.await(5, TimeUnit.SECONDS))
    }

    @After
    fun tearDown() {
        mainHandler.post {
            webView.destroy()
        }
    }

    // ========== Basic JavaScript Execution ==========

    @Test
    fun webViewCanExecuteBasicJavaScript() {
        val resultRef = AtomicReference<String?>()
        val latch = CountDownLatch(1)

        mainHandler.post {
            webView.evaluateJavascript("2 + 2") { result ->
                resultRef.set(result)
                latch.countDown()
            }
        }

        assertTrue("Should receive JavaScript result", latch.await(5, TimeUnit.SECONDS))
        assertEquals("Should calculate correctly", "4", resultRef.get())
    }

    @Test
    fun webViewCanExecuteJSONStringify() {
        val resultRef = AtomicReference<String?>()
        val latch = CountDownLatch(1)

        mainHandler.post {
            webView.evaluateJavascript(
                """
                JSON.stringify({ key: 'value', number: 42 })
                """.trimIndent(),
            ) { result ->
                resultRef.set(result)
                latch.countDown()
            }
        }

        assertTrue("Should receive JavaScript result", latch.await(5, TimeUnit.SECONDS))

        val jsonString = resultRef.get()?.trim('"')?.replace("\\", "")
        assertNotNull("JSON result should not be null", jsonString)

        val json = JSONObject(jsonString!!)
        assertEquals("Should have correct key", "value", json.getString("key"))
        assertEquals("Should have correct number", 42, json.getInt("number"))
    }

    // ========== JavaScript Interface Bridge ==========

    @Test
    fun javascriptInterfaceCanReceiveMessages() {
        val receivedMessage = AtomicReference<String?>()
        val latch = CountDownLatch(1)

        val bridge = object {
            @JavascriptInterface
            fun postMessage(message: String) {
                receivedMessage.set(message)
                latch.countDown()
            }
        }

        mainHandler.post {
            webView.addJavascriptInterface(bridge, "TestBridge")
            webView.loadData(
                """
                <html>
                <script>
                    TestBridge.postMessage('Hello from JavaScript');
                </script>
                </html>
                """.trimIndent(),
                "text/html",
                "UTF-8",
            )
        }

        assertTrue("Should receive message from JavaScript", latch.await(10, TimeUnit.SECONDS))
        assertEquals("Should receive correct message", "Hello from JavaScript", receivedMessage.get())
    }

    @Test
    fun javascriptInterfaceCanReceiveJSONMessages() {
        val receivedJson = AtomicReference<JSONObject?>()
        val latch = CountDownLatch(1)

        val bridge = object {
            @JavascriptInterface
            fun postMessage(jsonString: String) {
                try {
                    receivedJson.set(JSONObject(jsonString))
                    latch.countDown()
                } catch (e: Exception) {
                    // Ignore parse errors
                }
            }
        }

        mainHandler.post {
            webView.addJavascriptInterface(bridge, "TestBridge")
            webView.loadData(
                """
                <html>
                <script>
                    const payload = { type: 'test', value: 42, flag: true };
                    TestBridge.postMessage(JSON.stringify(payload));
                </script>
                </html>
                """.trimIndent(),
                "text/html",
                "UTF-8",
            )
        }

        assertTrue("Should receive JSON message", latch.await(10, TimeUnit.SECONDS))

        val json = receivedJson.get()
        assertNotNull("JSON should be parsed", json)
        assertEquals("Should have correct type", "test", json!!.getString("type"))
        assertEquals("Should have correct value", 42, json.getInt("value"))
        assertTrue("Should have correct flag", json.getBoolean("flag"))
    }

    @Test
    fun javascriptInterfaceCanHandleMultipleMessages() {
        val messageCount = AtomicReference(0)
        val latch = CountDownLatch(3)

        val bridge = object {
            @JavascriptInterface
            fun postMessage(message: String) {
                messageCount.set(messageCount.get() + 1)
                latch.countDown()
            }
        }

        mainHandler.post {
            webView.addJavascriptInterface(bridge, "TestBridge")
            webView.loadData(
                """
                <html>
                <script>
                    TestBridge.postMessage('message1');
                    TestBridge.postMessage('message2');
                    TestBridge.postMessage('message3');
                </script>
                </html>
                """.trimIndent(),
                "text/html",
                "UTF-8",
            )
        }

        assertTrue("Should receive all messages", latch.await(10, TimeUnit.SECONDS))
        assertEquals("Should receive 3 messages", 3, messageCount.get())
    }

    // ========== Error Handling ==========

    @Test
    fun javascriptInterfaceHandlesInvalidJSON() {
        val receivedMessage = AtomicReference<String?>()
        val latch = CountDownLatch(1)

        val bridge = object {
            @JavascriptInterface
            fun postMessage(message: String) {
                receivedMessage.set(message)
                latch.countDown()
            }
        }

        mainHandler.post {
            webView.addJavascriptInterface(bridge, "TestBridge")
            webView.loadData(
                """
                <html>
                <script>
                    TestBridge.postMessage('not a valid {json}');
                </script>
                </html>
                """.trimIndent(),
                "text/html",
                "UTF-8",
            )
        }

        assertTrue("Should receive message even if invalid JSON", latch.await(10, TimeUnit.SECONDS))
        assertNotNull("Message should be received", receivedMessage.get())
        assertFalse("Message should not be empty", receivedMessage.get()!!.isEmpty())
    }

    @Test
    fun javascriptInterfaceHandlesEmptyString() {
        val receivedMessage = AtomicReference<String?>()
        val latch = CountDownLatch(1)

        val bridge = object {
            @JavascriptInterface
            fun postMessage(message: String) {
                receivedMessage.set(message)
                latch.countDown()
            }
        }

        mainHandler.post {
            webView.addJavascriptInterface(bridge, "TestBridge")
            webView.loadData(
                """
                <html>
                <script>
                    TestBridge.postMessage('');
                </script>
                </html>
                """.trimIndent(),
                "text/html",
                "UTF-8",
            )
        }

        assertTrue("Should receive empty message", latch.await(10, TimeUnit.SECONDS))
        assertEquals("Message should be empty string", "", receivedMessage.get())
    }

    // ========== Complex Data Types ==========

    @Test
    fun javascriptInterfaceHandlesNestedJSON() {
        val receivedJson = AtomicReference<JSONObject?>()
        val latch = CountDownLatch(1)

        val bridge = object {
            @JavascriptInterface
            fun postMessage(jsonString: String) {
                try {
                    receivedJson.set(JSONObject(jsonString))
                    latch.countDown()
                } catch (e: Exception) {
                    // Ignore
                }
            }
        }

        mainHandler.post {
            webView.addJavascriptInterface(bridge, "TestBridge")
            webView.loadData(
                """
                <html>
                <script>
                    const nested = {
                        outer: {
                            inner: {
                                value: 'deeply nested'
                            }
                        },
                        array: [1, 2, 3]
                    };
                    TestBridge.postMessage(JSON.stringify(nested));
                </script>
                </html>
                """.trimIndent(),
                "text/html",
                "UTF-8",
            )
        }

        assertTrue("Should receive nested JSON", latch.await(10, TimeUnit.SECONDS))

        val json = receivedJson.get()
        assertNotNull("JSON should be parsed", json)

        val outer = json!!.getJSONObject("outer")
        val inner = outer.getJSONObject("inner")
        assertEquals("Should have deeply nested value", "deeply nested", inner.getString("value"))

        val array = json.getJSONArray("array")
        assertEquals("Array should have 3 elements", 3, array.length())
        assertEquals("Array should have correct values", 1, array.getInt(0))
    }

    @Test
    fun javascriptInterfaceHandlesUnicodeCharacters() {
        val receivedMessage = AtomicReference<String?>()
        val latch = CountDownLatch(1)

        val bridge = object {
            @JavascriptInterface
            fun postMessage(message: String) {
                receivedMessage.set(message)
                latch.countDown()
            }
        }

        mainHandler.post {
            webView.addJavascriptInterface(bridge, "TestBridge")
            webView.loadData(
                """
                <html>
                <script>
                    TestBridge.postMessage('Hello 世界 🌍 Привет');
                </script>
                </html>
                """.trimIndent(),
                "text/html",
                "UTF-8",
            )
        }

        assertTrue("Should receive unicode message", latch.await(10, TimeUnit.SECONDS))
        assertEquals("Should handle unicode correctly", "Hello 世界 🌍 Привет", receivedMessage.get())
    }

    // ========== Performance Tests ==========

    @Test
    fun javascriptInterfaceHandlesRapidMessages() {
        val messageCount = AtomicReference(0)
        val latch = CountDownLatch(100)

        val bridge = object {
            @JavascriptInterface
            fun postMessage(message: String) {
                messageCount.set(messageCount.get() + 1)
                latch.countDown()
            }
        }

        mainHandler.post {
            webView.addJavascriptInterface(bridge, "TestBridge")
            webView.loadData(
                """
                <html>
                <script>
                    for (let i = 0; i < 100; i++) {
                        TestBridge.postMessage('message_' + i);
                    }
                </script>
                </html>
                """.trimIndent(),
                "text/html",
                "UTF-8",
            )
        }

        assertTrue("Should handle 100 rapid messages", latch.await(15, TimeUnit.SECONDS))
        assertEquals("Should receive all 100 messages", 100, messageCount.get())
    }
}
