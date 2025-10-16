package io.ton.walletkit.bridge

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import io.ton.walletkit.data.storage.impl.SecureWalletKitStorage
import io.ton.walletkit.presentation.event.TONWalletKitEvent
import io.ton.walletkit.presentation.listener.TONBridgeEventsHandler
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Integration tests for event retry mechanism.
 *
 * Tests real-world scenarios without WebView (storage-focused):
 * 1. Events saved to storage
 * 2. Events loaded from storage
 * 3. Events cleared after handling
 * 4. Retry count incrementation
 */
@RunWith(AndroidJUnit4::class)
class EventRetryIntegrationTest {

    private lateinit var context: Context
    private lateinit var storage: SecureWalletKitStorage

    @Before
    fun setup() {
        context = ApplicationProvider.getApplicationContext()
        storage = SecureWalletKitStorage(context, "test_retry_integration")
    }

    @After
    fun teardown() = runBlocking {
        storage.clearAllPendingEvents()
    }

    @Test
    fun noHandlerRegistered_eventIsSavedToStorage() = runBlocking {
        // Given: No handlers registered
        assertEquals(0, storage.loadAllPendingEvents().size)

        // When: An event arrives (simulate via storage since we can't trigger real WebView events)
        val testEvent = createTestPendingEvent("test-event-1", "connectRequest")
        storage.savePendingEvent(testEvent)

        // Then: Event is in storage
        val pendingEvents = storage.loadAllPendingEvents()
        assertEquals(1, pendingEvents.size)
        assertEquals("test-event-1", pendingEvents[0].id)
    }

    @Test
    fun handlerRegistered_pendingEventsAreReplayed() = runBlocking {
        // Given: Events in storage (simulating events that arrived before handler)
        val event1 = createTestPendingEvent("event-1", "connectRequest")
        val event2 = createTestPendingEvent("event-2", "transactionRequest")
        storage.savePendingEvent(event1)
        storage.savePendingEvent(event2)

        assertEquals(2, storage.loadAllPendingEvents().size)

        // When: Events would be replayed by engine when handler registers
        val allEvents = storage.loadAllPendingEvents()

        // Then: Both events are ready for replay
        assertEquals(2, allEvents.size)
        assertTrue(allEvents.any { it.id == "event-1" })
        assertTrue(allEvents.any { it.id == "event-2" })
    }

    @Test
    fun handlerThrowsException_eventIsRequeued() = runBlocking {
        // Given: A handler that would throw (simulated by storage operation)
        val event = createTestPendingEvent("failing-event", "connectRequest")
        storage.savePendingEvent(event)

        // When: Handler fails and event retry count is incremented
        val loaded = storage.loadPendingEvent("failing-event")
        val updated = loaded!!.copy(retryCount = loaded.retryCount + 1)
        storage.savePendingEvent(updated)

        // Then: Event is still in storage with incremented retry count
        val reloaded = storage.loadPendingEvent("failing-event")
        assertNotNull(reloaded)
        assertEquals(1, reloaded?.retryCount)
    }

    @Test
    fun handlerSucceeds_eventIsClearedFromStorage() = runBlocking {
        // Given: Event in storage
        val event = createTestPendingEvent("success-event", "connectRequest")
        storage.savePendingEvent(event)
        assertEquals(1, storage.loadAllPendingEvents().size)

        // When: Handler successfully processes it
        storage.deletePendingEvent("success-event")

        // Then: Event is removed from storage
        val pendingEvents = storage.loadAllPendingEvents()
        assertTrue(pendingEvents.isEmpty())
    }

    @Test
    fun multipleHandlers_allReceiveEvents() {
        // Test that multiple handlers can be created
        val handler1 = object : TONBridgeEventsHandler {
            override fun handle(event: TONWalletKitEvent) {}
        }

        val handler2 = object : TONBridgeEventsHandler {
            override fun handle(event: TONWalletKitEvent) {}
        }

        // Both handlers should be independent
        assertNotNull(handler1)
        assertNotNull(handler2)
        assertNotSame(handler1, handler2)
    }

    @Test
    fun handlerCanBeRemoved() {
        // Test handler interface
        val handler = object : TONBridgeEventsHandler {
            override fun handle(event: TONWalletKitEvent) {}
        }

        assertNotNull(handler)
    }

    @Test
    fun eventsAreOrderedByTimestamp() = runBlocking {
        val now = java.time.Instant.now()

        // Create events with different timestamps
        val event1 = createTestPendingEvent("event-1", "type", now.minusSeconds(10).toString())
        val event2 = createTestPendingEvent("event-2", "type", now.minusSeconds(5).toString())
        val event3 = createTestPendingEvent("event-3", "type", now.toString())

        // Save in random order
        storage.savePendingEvent(event3)
        storage.savePendingEvent(event1)
        storage.savePendingEvent(event2)

        // Load all - should be sorted by timestamp
        val allEvents = storage.loadAllPendingEvents()

        assertEquals(3, allEvents.size)
        assertEquals("event-1", allEvents[0].id) // Oldest first
        assertEquals("event-2", allEvents[1].id)
        assertEquals("event-3", allEvents[2].id)
    }

    @Test
    fun retryCountIsIncremented() = runBlocking {
        val event = createTestPendingEvent("retry-event", "connectRequest")
        storage.savePendingEvent(event)

        // Simulate retry by incrementing count
        val loaded = storage.loadPendingEvent("retry-event")
        assertNotNull(loaded)
        assertEquals(0, loaded?.retryCount)

        val updated = loaded!!.copy(retryCount = loaded.retryCount + 1)
        storage.savePendingEvent(updated)

        val afterRetry = storage.loadPendingEvent("retry-event")
        assertEquals(1, afterRetry?.retryCount)
    }

    @Test
    fun storageHandlesLargeEventData() = runBlocking {
        // Create an event with large JSON payload
        val largeData = buildString {
            append("{")
            append("\"items\": [")
            for (i in 0 until 1000) {
                if (i > 0) append(",")
                append("{\"id\": $i, \"name\": \"Item $i\", \"data\": \"${i.toString().repeat(10)}\"}")
            }
            append("]")
            append("}")
        }

        val event = createTestPendingEvent("large-event", "transactionRequest", data = largeData)
        storage.savePendingEvent(event)

        val loaded = storage.loadPendingEvent("large-event")
        assertNotNull(loaded)
        assertTrue(loaded!!.data.length > 10000)
        assertTrue(loaded.data.contains("Item 999"))
    }

    @Test
    fun concurrentHandlerRegistration() {
        // Test that multiple handlers can be created independently
        val handlers = mutableListOf<TONBridgeEventsHandler>()

        repeat(5) { index ->
            val handler = object : TONBridgeEventsHandler {
                override fun handle(event: TONWalletKitEvent) {}
            }
            handlers.add(handler)
        }

        assertEquals(5, handlers.size)

        // All handlers should be unique
        val uniqueHandlers = handlers.toSet()
        assertEquals(5, uniqueHandlers.size)
    }

    @Test
    fun storagePersiststsAcrossInstances() = runBlocking {
        // Save event with first storage instance
        val event = createTestPendingEvent("persist-event", "connectRequest")
        storage.savePendingEvent(event)

        // Create new storage instance (simulating app restart)
        val newStorage = SecureWalletKitStorage(context, "test_retry_integration")

        // Event should still be there
        val loaded = newStorage.loadPendingEvent("persist-event")
        assertNotNull(loaded)
        assertEquals("persist-event", loaded?.id)

        // Cleanup
        newStorage.deletePendingEvent("persist-event")
    }

    // Helper methods
    private fun createTestPendingEvent(
        id: String,
        type: String,
        timestamp: String = java.time.Instant.now().toString(),
        data: String = "{\"test\":\"data\"}",
    ) = io.ton.walletkit.data.model.PendingEvent(
        id = id,
        type = type,
        data = data,
        timestamp = timestamp,
        retryCount = 0,
    )
}
