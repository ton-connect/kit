package io.ton.walletkit.demo.presentation.util

import androidx.recyclerview.widget.DiffUtil
import io.ton.walletkit.domain.model.Transaction

/**
 * DiffUtil callback for efficiently calculating differences between transaction lists.
 * Uses transaction hash as the unique identifier.
 */
class TransactionDiffCallback(
    private val oldList: List<Transaction>,
    private val newList: List<Transaction>,
) : DiffUtil.Callback() {

    override fun getOldListSize(): Int = oldList.size

    override fun getNewListSize(): Int = newList.size

    /**
     * Check if items represent the same transaction (same hash).
     */
    override fun areItemsTheSame(oldItemPosition: Int, newItemPosition: Int): Boolean {
        val oldItem = oldList[oldItemPosition]
        val newItem = newList[newItemPosition]
        return oldItem.hash == newItem.hash
    }

    /**
     * Check if the contents of the transaction are the same.
     * This is called only when areItemsTheSame returns true.
     */
    override fun areContentsTheSame(oldItemPosition: Int, newItemPosition: Int): Boolean {
        val oldItem = oldList[oldItemPosition]
        val newItem = newList[newItemPosition]

        // Compare all fields that might change
        return oldItem.hash == newItem.hash &&
            oldItem.timestamp == newItem.timestamp &&
            oldItem.amount == newItem.amount &&
            oldItem.fee == newItem.fee &&
            oldItem.comment == newItem.comment &&
            oldItem.sender == newItem.sender &&
            oldItem.recipient == newItem.recipient &&
            oldItem.type == newItem.type &&
            oldItem.lt == newItem.lt &&
            oldItem.blockSeqno == newItem.blockSeqno
    }

    /**
     * Get the payload of changes between old and new items.
     * This can be used for partial updates in the UI.
     */
    override fun getChangePayload(oldItemPosition: Int, newItemPosition: Int): Any? {
        val oldItem = oldList[oldItemPosition]
        val newItem = newList[newItemPosition]

        // Create a list of changed fields
        val changes = mutableListOf<String>()

        if (oldItem.amount != newItem.amount) changes.add("amount")
        if (oldItem.fee != newItem.fee) changes.add("fee")
        if (oldItem.comment != newItem.comment) changes.add("comment")
        if (oldItem.type != newItem.type) changes.add("type")
        if (oldItem.blockSeqno != newItem.blockSeqno) changes.add("blockSeqno")

        return if (changes.isNotEmpty()) changes else null
    }
}

/**
 * Helper object for calculating transaction list diffs.
 */
object TransactionDiffUtil {

    /**
     * Calculate the difference between two transaction lists.
     * Returns a DiffUtil.DiffResult that can be used to update UI efficiently.
     */
    fun calculateDiff(
        oldList: List<Transaction>,
        newList: List<Transaction>,
        detectMoves: Boolean = true,
    ): DiffUtil.DiffResult {
        val callback = TransactionDiffCallback(oldList, newList)
        return DiffUtil.calculateDiff(callback, detectMoves)
    }

    /**
     * Check if two transaction lists are effectively the same.
     * This is a quick check based on size and hash values.
     */
    fun areListsEqual(
        oldList: List<Transaction>,
        newList: List<Transaction>,
    ): Boolean {
        if (oldList.size != newList.size) return false

        // Quick hash-based comparison
        val oldHashes = oldList.map { it.hash }.toSet()
        val newHashes = newList.map { it.hash }.toSet()

        return oldHashes == newHashes
    }

    /**
     * Get new transactions (transactions in newList but not in oldList).
     */
    fun getNewTransactions(
        oldList: List<Transaction>,
        newList: List<Transaction>,
    ): List<Transaction> {
        val oldHashes = oldList.map { it.hash }.toSet()
        return newList.filter { it.hash !in oldHashes }
    }

    /**
     * Get removed transactions (transactions in oldList but not in newList).
     */
    fun getRemovedTransactions(
        oldList: List<Transaction>,
        newList: List<Transaction>,
    ): List<Transaction> {
        val newHashes = newList.map { it.hash }.toSet()
        return oldList.filter { it.hash !in newHashes }
    }

    /**
     * Merge two transaction lists, preferring newer data.
     * Deduplicates by hash and sorts by timestamp descending.
     */
    fun mergeLists(
        oldList: List<Transaction>,
        newList: List<Transaction>,
        maxSize: Int = 100,
    ): List<Transaction> {
        val transactionMap = mutableMapOf<String, Transaction>()

        // Add old transactions first
        oldList.forEach { tx ->
            transactionMap[tx.hash] = tx
        }

        // Add/update with new transactions (overwrites existing)
        newList.forEach { tx ->
            transactionMap[tx.hash] = tx
        }

        // Sort by timestamp descending and limit
        return transactionMap.values
            .sortedByDescending { it.timestamp }
            .take(maxSize)
    }
}
