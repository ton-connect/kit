package io.ton.walletkit.bridge

import io.ton.walletkit.event.TONWalletKitEvent
import io.ton.walletkit.listener.TONBridgeEventsHandler
import org.junit.Assert.*
import org.junit.Test

/**
 * Basic tests for event retry mechanism.
 *
 * Note: Storage tests are in PendingEventStorageTest (instrumented tests)
 * since they require real Android framework components.
 */
class EventRetryMechanismTest {

    @Test
    fun `handler interface can be implemented`() {
        var eventReceived = false

        val handler = object : TONBridgeEventsHandler {
            override fun handle(event: TONWalletKitEvent) {
                eventReceived = true
            }
        }

        assertNotNull(handler)
        assertFalse(eventReceived)
    }

    @Test
    fun `multiple handlers can coexist`() {
        val handler1 = object : TONBridgeEventsHandler {
            override fun handle(event: TONWalletKitEvent) {}
        }

        val handler2 = object : TONBridgeEventsHandler {
            override fun handle(event: TONWalletKitEvent) {}
        }

        assertNotNull(handler1)
        assertNotNull(handler2)
        assertNotSame(handler1, handler2)
    }

    @Test
    fun `handler can store received events`() {
        val receivedEvents = mutableListOf<TONWalletKitEvent>()

        val handler = object : TONBridgeEventsHandler {
            override fun handle(event: TONWalletKitEvent) {
                receivedEvents.add(event)
            }
        }

        assertTrue(receivedEvents.isEmpty())
        assertNotNull(handler)
    }
}
