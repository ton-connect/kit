package io.ton.walletkit.engine

import android.util.Log
import io.ton.walletkit.event.TONWalletKitEvent
import io.ton.walletkit.internal.constants.LogConstants
import io.ton.walletkit.listener.TONBridgeEventsHandler
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

/**
 * Coordinates registration and invocation of [TONBridgeEventsHandler] instances.
 *
 * The router encapsulates the concurrency guarantees required by the bridge: handler collections
 * are mutated under a mutex, and dispatching obtains a snapshot to avoid concurrent modifications.
 * Logging mirrors the behaviour that previously lived in [WebViewWalletKitEngine].
 *
 * @suppress Internal component. Use through [WebViewWalletKitEngine].
 */
internal class EventRouter {
    private val eventHandlers = mutableListOf<TONBridgeEventsHandler>()
    private val mutex = Mutex()
    @Volatile private var handlerCount: Int = 0

    /**
     * Register a handler. Returns metadata describing whether the handler was added and if it was
     * the first one in the collection.
     */
    suspend fun addHandler(handler: TONBridgeEventsHandler, logAcquired: Boolean = false): AddHandlerOutcome =
        mutex.withLock {
            if (logAcquired) {
                Log.d(TAG, "🔵 eventHandlersMutex acquired in addEventsHandler")
            }
            val existingHandlers = eventHandlers.toList()
            if (eventHandlers.contains(handler)) {
                AddHandlerOutcome(
                    alreadyRegistered = true,
                    isFirstHandler = false,
                    handlersBeforeAdd = existingHandlers,
                    handlersAfterAdd = existingHandlers,
                )
            } else {
                val wasEmpty = eventHandlers.isEmpty()
                eventHandlers.add(handler)
                handlerCount = eventHandlers.size
                AddHandlerOutcome(
                    alreadyRegistered = false,
                    isFirstHandler = wasEmpty,
                    handlersBeforeAdd = existingHandlers,
                    handlersAfterAdd = eventHandlers.toList(),
                )
            }
        }

    /**
     * Unregister a handler. Returns whether the handler was removed and if the collection is empty.
     */
    suspend fun removeHandler(handler: TONBridgeEventsHandler): RemoveHandlerOutcome =
        mutex.withLock {
            val removed = eventHandlers.remove(handler)
            if (removed) {
                handlerCount = eventHandlers.size
            }
            RemoveHandlerOutcome(
                removed = removed,
                isEmpty = eventHandlers.isEmpty(),
            )
        }

    suspend fun containsHandler(handler: TONBridgeEventsHandler): Boolean =
        mutex.withLock { eventHandlers.contains(handler) }

    /**
     * Dispatch an event to all registered handlers, preserving legacy logging semantics.
     */
    suspend fun dispatchEvent(
        eventId: String,
        type: String,
        event: TONWalletKitEvent,
    ) {
        try {
            Log.d(TAG, "🟢 Acquiring eventHandlersMutex to get handlers list...")
            val handlers =
                mutex.withLock {
                    Log.d(TAG, "🟢 eventHandlersMutex acquired, eventHandlers.size=${eventHandlers.size}")
                    eventHandlers.toList()
                }

            Log.d(TAG, "🟢 Got ${handlers.size} handlers, notifying each...")
            for (handler in handlers) {
                try {
                    Log.d(TAG, "🟢 Calling handler.handle() for ${handler.javaClass.simpleName}")
                    handler.handle(event)
                    Log.d(TAG, "✅ Handler ${handler.javaClass.simpleName} processed event successfully")
                } catch (e: Exception) {
                    Log.e(TAG, "❌ " + MSG_HANDLER_EXCEPTION_PREFIX + eventId + " for handler ${handler.javaClass.simpleName}", e)
                }
            }
            Log.d(TAG, "✅ All handlers notified for event $type")
        } catch (e: Exception) {
            Log.e(TAG, "❌ " + MSG_HANDLER_EXCEPTION_PREFIX + eventId, e)
        }
    }

    /**
     * Current number of registered handlers.
     */
    fun getHandlerCount(): Int = handlerCount

    data class AddHandlerOutcome(
        val alreadyRegistered: Boolean,
        val isFirstHandler: Boolean,
        val handlersBeforeAdd: List<TONBridgeEventsHandler>,
        val handlersAfterAdd: List<TONBridgeEventsHandler>,
    )

    data class RemoveHandlerOutcome(
        val removed: Boolean,
        val isEmpty: Boolean,
    )

    private companion object {
        private const val TAG = LogConstants.TAG_WEBVIEW_ENGINE
        private const val MSG_HANDLER_EXCEPTION_PREFIX = "Handler threw exception for event "
    }
}
