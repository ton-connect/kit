package io.ton.walletkit.bridge

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import io.ton.walletkit.data.model.PendingEvent
import io.ton.walletkit.data.storage.impl.SecureWalletKitStorage
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import java.time.Instant

/**
 * Instrumented tests for pending event storage.
 *
 * Tests the storage layer that persists events for automatic retry.
 */
@RunWith(AndroidJUnit4::class)
class PendingEventStorageTest {

    private lateinit var storage: SecureWalletKitStorage
    private lateinit var context: Context

    @Before
    fun setup() {
        context = ApplicationProvider.getApplicationContext()
        storage = SecureWalletKitStorage(context, "test_pending_events")
    }

    @After
    fun teardown() = runBlocking {
        storage.clearAllPendingEvents()
    }

    @Test
    fun saveAndLoadPendingEvent() = runBlocking {
        val event = PendingEvent(
            id = "event-123",
            type = "connectRequest",
            data = """{"dAppName":"Test dApp","permissions":[]}""",
            timestamp = Instant.now().toString(),
            retryCount = 0,
        )

        storage.savePendingEvent(event)
        val loaded = storage.loadPendingEvent("event-123")

        assertNotNull(loaded)
        assertEquals(event.id, loaded?.id)
        assertEquals(event.type, loaded?.type)
        assertEquals(event.data, loaded?.data)
        assertEquals(event.retryCount, loaded?.retryCount)
    }

    @Test
    fun loadNonExistentEventReturnsNull() = runBlocking {
        val loaded = storage.loadPendingEvent("non-existent-id")
        assertNull(loaded)
    }

    @Test
    fun saveMultipleEventsAndLoadAll() = runBlocking {
        val event1 = PendingEvent(
            id = "event-1",
            type = "connectRequest",
            data = """{"dAppName":"dApp1"}""",
            timestamp = Instant.now().toString(),
            retryCount = 0,
        )

        val event2 = PendingEvent(
            id = "event-2",
            type = "transactionRequest",
            data = """{"messages":[]}""",
            timestamp = Instant.now().toString(),
            retryCount = 1,
        )

        val event3 = PendingEvent(
            id = "event-3",
            type = "signDataRequest",
            data = """{"payload":"test"}""",
            timestamp = Instant.now().toString(),
            retryCount = 2,
        )

        storage.savePendingEvent(event1)
        storage.savePendingEvent(event2)
        storage.savePendingEvent(event3)

        val allEvents = storage.loadAllPendingEvents()

        assertEquals(3, allEvents.size)
        assertTrue(allEvents.any { it.id == "event-1" })
        assertTrue(allEvents.any { it.id == "event-2" })
        assertTrue(allEvents.any { it.id == "event-3" })
    }

    @Test
    fun deleteSpecificPendingEvent() = runBlocking {
        val event1 = PendingEvent(
            id = "event-1",
            type = "connectRequest",
            data = """{}""",
            timestamp = Instant.now().toString(),
            retryCount = 0,
        )

        val event2 = PendingEvent(
            id = "event-2",
            type = "transactionRequest",
            data = """{}""",
            timestamp = Instant.now().toString(),
            retryCount = 0,
        )

        storage.savePendingEvent(event1)
        storage.savePendingEvent(event2)

        storage.deletePendingEvent("event-1")

        val loaded1 = storage.loadPendingEvent("event-1")
        val loaded2 = storage.loadPendingEvent("event-2")

        assertNull(loaded1)
        assertNotNull(loaded2)
    }

    @Test
    fun clearAllPendingEvents() = runBlocking {
        val event1 = PendingEvent(
            id = "event-1",
            type = "connectRequest",
            data = """{}""",
            timestamp = Instant.now().toString(),
            retryCount = 0,
        )

        val event2 = PendingEvent(
            id = "event-2",
            type = "transactionRequest",
            data = """{}""",
            timestamp = Instant.now().toString(),
            retryCount = 0,
        )

        storage.savePendingEvent(event1)
        storage.savePendingEvent(event2)

        storage.clearAllPendingEvents()

        val allEvents = storage.loadAllPendingEvents()
        assertTrue(allEvents.isEmpty())
    }

    @Test
    fun updateEventRetryCount() = runBlocking {
        val event = PendingEvent(
            id = "event-1",
            type = "connectRequest",
            data = """{}""",
            timestamp = Instant.now().toString(),
            retryCount = 0,
        )

        storage.savePendingEvent(event)

        // Simulate retry by saving with incremented count
        val updatedEvent = event.copy(retryCount = event.retryCount + 1)
        storage.savePendingEvent(updatedEvent)

        val loaded = storage.loadPendingEvent("event-1")
        assertEquals(1, loaded?.retryCount)
    }

    @Test
    fun eventDataPreservesJSONStructure() = runBlocking {
        val complexData = """{
            "dAppInfo": {
                "name": "Test dApp",
                "url": "https://test.com",
                "iconUrl": "https://test.com/icon.png"
            },
            "permissions": ["sendTransaction", "signData"],
            "nested": {
                "value": 123,
                "array": [1, 2, 3]
            }
        }"""

        val event = PendingEvent(
            id = "event-complex",
            type = "connectRequest",
            data = complexData,
            timestamp = Instant.now().toString(),
            retryCount = 0,
        )

        storage.savePendingEvent(event)
        val loaded = storage.loadPendingEvent("event-complex")

        assertNotNull(loaded)
        // Verify JSON is preserved (whitespace may differ)
        assertTrue(loaded?.data?.contains("Test dApp") == true)
        assertTrue(loaded?.data?.contains("permissions") == true)
        assertTrue(loaded?.data?.contains("nested") == true)
    }

    @Test
    fun emptyPendingEventsListWhenNoneSaved() = runBlocking {
        val allEvents = storage.loadAllPendingEvents()
        assertTrue(allEvents.isEmpty())
    }

    @Test
    fun overwriteExistingPendingEventWithSameID() = runBlocking {
        val event1 = PendingEvent(
            id = "event-1",
            type = "connectRequest",
            data = """{"version":1}""",
            timestamp = Instant.now().toString(),
            retryCount = 0,
        )

        val event2 = PendingEvent(
            id = "event-1",
            type = "connectRequest",
            data = """{"version":2}""",
            timestamp = Instant.now().toString(),
            retryCount = 1,
        )

        storage.savePendingEvent(event1)
        storage.savePendingEvent(event2)

        val loaded = storage.loadPendingEvent("event-1")
        assertTrue(loaded?.data?.contains("version\":2") == true)
        assertEquals(1, loaded?.retryCount)
    }

    @Test
    fun eventsAreSortedByTimestamp() = runBlocking {
        // Create events with different timestamps
        val now = Instant.now()
        val event1 = PendingEvent(
            id = "event-1",
            type = "connectRequest",
            data = """{}""",
            timestamp = now.minusSeconds(10).toString(),
            retryCount = 0,
        )

        val event2 = PendingEvent(
            id = "event-2",
            type = "transactionRequest",
            data = """{}""",
            timestamp = now.minusSeconds(5).toString(),
            retryCount = 0,
        )

        val event3 = PendingEvent(
            id = "event-3",
            type = "signDataRequest",
            data = """{}""",
            timestamp = now.toString(),
            retryCount = 0,
        )

        // Save in random order
        storage.savePendingEvent(event2)
        storage.savePendingEvent(event3)
        storage.savePendingEvent(event1)

        val allEvents = storage.loadAllPendingEvents()

        // Verify they come back sorted oldest first
        assertEquals("event-1", allEvents[0].id)
        assertEquals("event-2", allEvents[1].id)
        assertEquals("event-3", allEvents[2].id)
    }
}
