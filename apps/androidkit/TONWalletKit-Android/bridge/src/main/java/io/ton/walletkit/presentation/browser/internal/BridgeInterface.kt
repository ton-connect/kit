package io.ton.walletkit.presentation.browser.internal

import android.util.Log
import android.webkit.JavascriptInterface
import io.ton.walletkit.domain.constants.BrowserConstants
import org.json.JSONObject
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.LinkedBlockingQueue

/**
 * JavaScript interface for bridge communication.
 * Messages from injected bridge come through this interface.
 *
 * Each message includes a frameId to identify which window/iframe sent it.
 *
 * This interface is automatically available in ALL frames (parent + iframes)
 * thanks to addJavascriptInterface() behavior.
 */
internal class BridgeInterface(
    private val onMessage: (message: JSONObject, type: String) -> Unit,
    private val onError: (error: String) -> Unit,
    private val onResponse: ((message: JSONObject) -> Unit)? = null,
) {
    // Thread-safe storage for responses that iframes can pull
    // Limit size to prevent unbounded growth if responses are never pulled
    private val availableResponses = ConcurrentHashMap<String, ResponseEntry>()

    // Thread-safe queue for events (like disconnect) that any frame can pull
    // Using a bounded queue to prevent memory leaks
    private val pendingEvents = LinkedBlockingQueue<String>(MAX_PENDING_EVENTS)

    private data class ResponseEntry(
        val response: String,
        val timestamp: Long = System.currentTimeMillis()
    )

    init {
        // Start a background cleanup task to remove stale responses
        startCleanupTask()
    }

    private fun startCleanupTask() {
        // Clean up stale responses every 30 seconds
        Thread {
            while (true) {
                try {
                    Thread.sleep(CLEANUP_INTERVAL_MS)
                    cleanupStaleResponses()
                } catch (e: InterruptedException) {
                    break
                }
            }
        }.apply {
            isDaemon = true
            name = "BridgeInterface-Cleanup"
            start()
        }
    }

    private fun cleanupStaleResponses() {
        val now = System.currentTimeMillis()
        val staleEntries = availableResponses.entries.filter { (_, entry) ->
            now - entry.timestamp > RESPONSE_TTL_MS
        }
        
        staleEntries.forEach { (messageId, _) ->
            availableResponses.remove(messageId)
            Log.d(TAG, "🧹 Removed stale response for messageId: $messageId")
        }

        if (staleEntries.isNotEmpty()) {
            Log.d(TAG, "🧹 Cleaned up ${staleEntries.size} stale response(s)")
        }
    }

    @JavascriptInterface
    fun postMessage(message: String) {
        Log.d(TAG, "🔵 BridgeInterface.postMessage called with: $message")
        try {
            val json = JSONObject(message)
            val type = json.optString(BrowserConstants.KEY_TYPE)

            Log.d(TAG, "🔵Message type: $type")

            onMessage(json, type)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to handle bridge message", e)
            onError("Invalid bridge message: ${e.message}")
        }
    }

    /**
     * Store a response that any iframe can pull.
     * Called from Kotlin when a response is ready.
     */
    fun storeResponse(messageId: String, response: String) {
        // Enforce max size limit
        if (availableResponses.size >= MAX_STORED_RESPONSES) {
            // Remove oldest entry
            val oldestEntry = availableResponses.entries.minByOrNull { it.value.timestamp }
            oldestEntry?.let {
                availableResponses.remove(it.key)
                Log.w(TAG, "⚠️ Response storage full, removed oldest response: ${it.key}")
            }
        }
        
        Log.d(TAG, "📥 Storing response for messageId: $messageId")
        availableResponses[messageId] = ResponseEntry(response)
    }

    /**
     * Pull a response for a specific messageId.
     * Called from JavaScript in any frame (parent or iframe).
     * Returns the response JSON string or null if not available.
     */
    @JavascriptInterface
    fun pullResponse(messageId: String): String? {
        val entry = availableResponses.remove(messageId)
        if (entry != null) {
            Log.d(TAG, "📤 Pulled response for messageId: $messageId")
            return entry.response
        }
        return null
    }

    /**
     * Check if a response is available for a messageId.
     * Called from JavaScript to poll for responses.
     */
    @JavascriptInterface
    fun hasResponse(messageId: String): Boolean {
        return availableResponses.containsKey(messageId)
    }

    /**
     * Send a TonConnect response from the RPC bridge back to the internal browser WebView.
     * This is called by bridge.ts jsBridgeTransport to deliver responses.
     */
    @JavascriptInterface
    fun postResponse(message: String) {
        Log.d(TAG, "🟣 BridgeInterface.postResponse called with response to inject into WebView")
        try {
            val json = JSONObject(message)
            onResponse?.invoke(json) ?: Log.w(TAG, "No response handler configured")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to handle bridge response", e)
            onError("Invalid bridge response: ${e.message}")
        }
    }

    /**
     * Store an event (like disconnect) that any frame can pull.
     * Called from Kotlin when an event needs to be delivered to the dApp.
     * Also exposed to JavaScript so frames can re-queue events for other frames.
     */
    @JavascriptInterface
    fun storeEvent(event: String) {
        Log.d(TAG, "📥 Storing event: ${event.take(100)}")
        pendingEvents.offer(event)
    }

    /**
     * Pull the next pending event.
     * Called from JavaScript in any frame to check for new events.
     * Returns the event JSON string or null if no events are pending.
     */
    @JavascriptInterface
    fun pullEvent(): String? {
        val event = pendingEvents.poll()
        if (event != null) {
            Log.d(TAG, "📤 Pulled event: ${event.take(100)}")
        }
        return event
    }

    /**
     * Check if there are any pending events.
     * Called from JavaScript to poll for events.
     */
    @JavascriptInterface
    fun hasEvent(): Boolean {
        return pendingEvents.isNotEmpty()
    }

    companion object {
        private const val TAG = "BridgeInterface"
        private const val MAX_PENDING_EVENTS = 100 // Maximum events in queue
        private const val MAX_STORED_RESPONSES = 100 // Maximum responses in map
        private const val CLEANUP_INTERVAL_MS = 60_000L // Clean up every 60 seconds
        private const val RESPONSE_TTL_MS = 300_000L // Responses expire after 5 minutes
    }
}
