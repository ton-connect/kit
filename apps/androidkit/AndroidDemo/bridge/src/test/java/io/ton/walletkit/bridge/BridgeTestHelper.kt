package io.ton.walletkit.bridge

import android.os.Looper
import android.webkit.WebView
import io.mockk.every
import io.mockk.mockk
import io.ton.walletkit.bridge.impl.WebViewWalletKitEngine
import kotlinx.coroutines.CompletableDeferred
import org.json.JSONObject
import org.robolectric.Shadows

/**
 * Common test utilities and helper functions for bridge tests.
 * 
 * This object provides reusable testing infrastructure including:
 * - Engine creation with mocked WebView
 * - Response formatting utilities
 * - Script parsing helpers
 * - Reflection utilities for accessing private fields
 */
object BridgeTestHelper {

    /**
     * Create a test engine with mocked WebView and custom response provider.
     */
    fun createTestEngine(
        context: android.content.Context,
        responseProvider: (callId: String, method: String, payloadJson: String?) -> JSONObject
    ): WebViewWalletKitEngine {
        val engine = WebViewWalletKitEngine(context)
        flushMainThread()
        setPrivateField(engine, "webView", createWebViewStub(engine, responseProvider))
        completeReady(engine)
        return engine
    }

    /**
     * Create a mocked WebView that intercepts JavaScript calls and returns responses.
     */
    fun createWebViewStub(
        engine: WebViewWalletKitEngine,
        responseProvider: (callId: String, method: String, payloadJson: String?) -> JSONObject
    ): WebView {
        val webView = mockk<WebView>(relaxed = true)
        every { webView.evaluateJavascript(any(), any()) } answers {
            val script = firstArg<String>()
            val (callId, method, payloadJson) = parseCallScript(script)
            val response = responseProvider(callId, method, payloadJson)
            invokeHandleResponse(engine, callId, response)
            null
        }
        every { webView.destroy() } returns Unit
        every { webView.stopLoading() } returns Unit
        return webView
    }

    /**
     * Create a successful RPC response with the given data.
     */
    fun successResponse(data: Map<String, Any>): JSONObject = 
        JSONObject().apply { put("result", JSONObject(data)) }

    /**
     * Create an error RPC response with the given message.
     */
    fun errorResponse(message: String): JSONObject = 
        JSONObject().apply {
            put("error", JSONObject().apply { put("message", message) })
        }

    /**
     * Parse a JavaScript call script to extract call ID, method, and payload.
     */
    fun parseCallScript(script: String): Triple<String, String, String?> {
        val regex = Regex("""__walletkitCall\("([^"]+)","([^"]+)",(.*)\)""")
        val match = regex.find(script) ?: error("Unexpected script format: $script")
        val callId = match.groupValues[1]
        val method = match.groupValues[2]
        val payloadSegment = match.groupValues[3].trim()
        val payload = when {
            payloadSegment == "null" -> null
            payloadSegment.startsWith("atob(") -> {
                val base64 = payloadSegment.removePrefix("atob(").removeSuffix(")")
                val quoted = base64.trim('"')
                String(android.util.Base64.decode(quoted, android.util.Base64.NO_WRAP))
            }
            else -> payloadSegment.trim('"')
        }
        return Triple(callId, method, payload)
    }

    /**
     * Flush the main thread to ensure all posted tasks are executed.
     */
    fun flushMainThread() {
        Shadows.shadowOf(Looper.getMainLooper()).runToEndOfTasks()
    }

    /**
     * Complete the engine's ready state to allow RPC calls.
     */
    fun completeReady(engine: WebViewWalletKitEngine) {
        val field = engine::class.java.getDeclaredField("ready")
        field.isAccessible = true
        @Suppress("UNCHECKED_CAST")
        val ready = field.get(engine) as CompletableDeferred<Unit>
        if (!ready.isCompleted) {
            ready.complete(Unit)
        }
    }

    /**
     * Invoke the private handleResponse method on an engine.
     */
    fun invokeHandleResponse(
        engine: WebViewWalletKitEngine,
        callId: String,
        response: JSONObject
    ) {
        val method = engine::class.java.getDeclaredMethod("handleResponse", String::class.java, JSONObject::class.java)
        method.isAccessible = true
        method.invoke(engine, callId, response)
    }

    /**
     * Invoke the private handleEvent method on an engine.
     */
    fun invokeHandleEvent(
        engine: WebViewWalletKitEngine,
        event: JSONObject
    ) {
        val method = engine::class.java.getDeclaredMethod("handleEvent", JSONObject::class.java)
        method.isAccessible = true
        method.invoke(engine, event)
    }

    /**
     * Set a private field value on an instance using reflection.
     */
    fun setPrivateField(instance: Any, fieldName: String, value: Any) {
        val field = instance::class.java.getDeclaredField(fieldName)
        field.isAccessible = true
        field.set(instance, value)
    }

    /**
     * Get a private field value from an instance using reflection.
     */
    @Suppress("UNCHECKED_CAST")
    fun <T> getPrivateField(instance: Any, fieldName: String): T {
        val field = instance::class.java.getDeclaredField(fieldName)
        field.isAccessible = true
        return field.get(instance) as T
    }

    /**
     * Create a JSONObject from key-value pairs.
     */
    fun jsonObject(vararg entries: Pair<String, Any>): JSONObject = JSONObject().apply {
        entries.forEach { (key, value) -> put(key, value) }
    }
}
