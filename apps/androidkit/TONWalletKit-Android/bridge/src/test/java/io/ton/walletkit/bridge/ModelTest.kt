package io.ton.walletkit.bridge

import io.ton.walletkit.presentation.model.Transaction
import io.ton.walletkit.presentation.model.TransactionType
import io.ton.walletkit.presentation.model.WalletAccount
import io.ton.walletkit.presentation.model.WalletState
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull

/**
 * Tests for wallet data models.
 */
class ModelTest {

    @Test
    fun `WalletAccount has required fields`() {
        val wallet = WalletAccount(
            address = "EQDexample...",
            publicKey = "pubkey",
            name = "My Wallet",
            version = "v5r1",
            network = "mainnet",
            index = 0,
        )

        assertEquals("EQDexample...", wallet.address)
        assertEquals("v5r1", wallet.version)
    }

    @Test
    fun `WalletState contains balance and transactions`() {
        val tx = Transaction(
            hash = "hash123",
            timestamp = 1000L,
            amount = "100",
            type = TransactionType.INCOMING,
        )

        val state = WalletState(
            balance = "5000000000",
            transactions = listOf(tx),
        )

        assertEquals("5000000000", state.balance)
        assertEquals(1, state.transactions.size)
    }

    @Test
    fun `Transaction supports different types`() {
        val incoming = Transaction(
            hash = "1",
            timestamp = 100L,
            amount = "50",
            type = TransactionType.INCOMING,
        )

        val outgoing = Transaction(
            hash = "2",
            timestamp = 200L,
            amount = "30",
            type = TransactionType.OUTGOING,
        )

        assertEquals(TransactionType.INCOMING, incoming.type)
        assertEquals(TransactionType.OUTGOING, outgoing.type)
    }

    @Test
    fun `Transaction optional fields can be null`() {
        val tx = Transaction(
            hash = "hash",
            timestamp = 1000L,
            amount = "100",
        )

        assertNotNull(tx.hash)
        assertNull(tx.fee)
        assertNull(tx.comment)
    }
}
