package io.ton.walletkit.presentation.browser.internal

import android.util.Log
import android.webkit.JavascriptInterface
import io.ton.walletkit.domain.constants.BrowserConstants
import org.json.JSONObject
import java.util.concurrent.ConcurrentHashMap

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

    // Thread-safe storage for events that need to be broadcast to ALL frames
    // Maps event ID to EventBroadcast (event data + consumed frame IDs)
    private val broadcastEvents = ConcurrentHashMap<String, EventBroadcast>()

    private data class ResponseEntry(
        val response: String,
        val timestamp: Long = System.currentTimeMillis(),
    )

    private data class EventBroadcast(
        val eventData: String,
        val consumedByFrames: MutableSet<String> = mutableSetOf(),
        val timestamp: Long = System.currentTimeMillis(),
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

        // Clean up stale responses
        val staleResponses = availableResponses.entries.filter { (_, entry) ->
            now - entry.timestamp > RESPONSE_TTL_MS
        }

        staleResponses.forEach { (messageId, _) ->
            availableResponses.remove(messageId)
            Log.d(TAG, "🧹 Removed stale response for messageId: $messageId")
        }

        if (staleResponses.isNotEmpty()) {
            Log.d(TAG, "🧹 Cleaned up ${staleResponses.size} stale response(s)")
        }

        // Clean up stale broadcast events (older than 5 minutes)
        val staleEvents = broadcastEvents.entries.filter { (_, broadcast) ->
            now - broadcast.timestamp > RESPONSE_TTL_MS
        }

        staleEvents.forEach { (eventId, _) ->
            broadcastEvents.remove(eventId)
            Log.d(TAG, "🧹 Removed stale broadcast event: $eventId")
        }

        if (staleEvents.isNotEmpty()) {
            Log.d(TAG, "🧹 Cleaned up ${staleEvents.size} stale broadcast event(s)")
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
     * Store an event (like disconnect) that ALL frames can pull.
     * Called from Kotlin when an event needs to be delivered to the dApp.
     * Events are broadcast - each frame can pull independently.
     */
    @JavascriptInterface
    fun storeEvent(event: String) {
        try {
            val json = JSONObject(event)
            val eventId = "${System.currentTimeMillis()}-${event.hashCode()}"

            Log.d(TAG, "📥 Broadcasting event to all frames: ${event.take(100)}")

            // Enforce max size limit for broadcast events
            if (broadcastEvents.size >= MAX_BROADCAST_EVENTS) {
                // Remove oldest event
                val oldestEntry = broadcastEvents.entries.minByOrNull { it.value.timestamp }
                oldestEntry?.let {
                    broadcastEvents.remove(it.key)
                    Log.w(TAG, "⚠️ Broadcast storage full, removed oldest event: ${it.key}")
                }
            }

            broadcastEvents[eventId] = EventBroadcast(event)
            Log.d(TAG, "✅ Event stored for broadcast with ID: $eventId (total: ${broadcastEvents.size})")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to store event for broadcast", e)
        }
    }

    /**
     * Pull an event for a specific frame.
     * Called from JavaScript in any frame to check for new events.
     * Returns an event JSON string that this frame hasn't seen yet, or null.
     *
     * This implements broadcast: each frame gets each event once.
     */
    @JavascriptInterface
    fun pullEvent(frameId: String): String? {
        // Find first event that this frame hasn't consumed yet
        for ((eventId, broadcast) in broadcastEvents) {
            synchronized(broadcast) {
                if (!broadcast.consumedByFrames.contains(frameId)) {
                    // Mark this frame as having consumed the event
                    broadcast.consumedByFrames.add(frameId)
                    Log.d(TAG, "📤 Frame '$frameId' pulled event $eventId (consumed by ${broadcast.consumedByFrames.size} frames)")

                    // If all expected frames have consumed this event, or if too many frames have seen it, remove it
                    // We use a generous limit (10 frames) to ensure all legitimate frames get the event
                    if (broadcast.consumedByFrames.size >= MAX_FRAMES_PER_EVENT) {
                        broadcastEvents.remove(eventId)
                        Log.d(TAG, "🗑️ Removed event $eventId after being consumed by ${broadcast.consumedByFrames.size} frames")
                    }

                    return broadcast.eventData
                }
            }
        }

        return null
    }

    /**
     * Check if there are any pending events for a specific frame.
     * Called from JavaScript to poll for events.
     */
    @JavascriptInterface
    fun hasEvent(frameId: String): Boolean {
        return broadcastEvents.any { (_, broadcast) ->
            !broadcast.consumedByFrames.contains(frameId)
        }
    }

    companion object {
        private const val TAG = "BridgeInterface"
        private const val MAX_BROADCAST_EVENTS = 50 // Maximum broadcast events stored
        private const val MAX_FRAMES_PER_EVENT = 10 // Maximum frames that can consume one event
        private const val MAX_STORED_RESPONSES = 100 // Maximum responses in map
        private const val CLEANUP_INTERVAL_MS = 60_000L // Clean up every 60 seconds
        private const val RESPONSE_TTL_MS = 300_000L // Responses/events expire after 5 minutes
    }
}
