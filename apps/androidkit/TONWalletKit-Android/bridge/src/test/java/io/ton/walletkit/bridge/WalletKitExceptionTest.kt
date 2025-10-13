package io.ton.walletkit.bridge

import io.ton.walletkit.presentation.WalletKitBridgeException
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

/**
 * Tests for WalletKit exception handling to ensure errors
 * are properly typed and informative.
 */
class WalletKitExceptionTest {

    @Test
    fun `WalletKitBridgeException extends Exception`() {
        val exception = WalletKitBridgeException("Test error")
        assertTrue(exception is Exception)
    }

    @Test
    fun `exception preserves message`() {
        val message = "Wallet initialization failed"
        val exception = WalletKitBridgeException(message)
        assertEquals(message, exception.message)
    }

    @Test
    fun `exception can be caught as Exception`() {
        try {
            throw WalletKitBridgeException("Test")
        } catch (e: Exception) {
            assertNotNull(e)
            assertTrue(e is WalletKitBridgeException)
        }
    }

    @Test
    fun `exception can be caught as WalletKitBridgeException`() {
        try {
            throw WalletKitBridgeException("Specific error")
        } catch (e: WalletKitBridgeException) {
            assertEquals("Specific error", e.message)
        }
    }

    @Test
    fun `exception supports stack traces`() {
        val exception = WalletKitBridgeException("Test error")
        assertNotNull(exception.stackTrace)
        assertTrue(exception.stackTrace.isNotEmpty())
    }
}
