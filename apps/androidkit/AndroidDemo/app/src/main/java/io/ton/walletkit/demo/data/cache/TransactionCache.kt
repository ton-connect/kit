package io.ton.walletkit.demo.data.cache

import android.util.Log
import io.ton.walletkit.model.Transaction
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

/**
 * Cache for wallet transactions with deduplication and merging capabilities.
 * Uses transaction hash as unique identifier.
 */
class TransactionCache {
    private val mutex = Mutex()

    // Map of wallet address -> list of transactions (ordered by timestamp desc)
    private val cache = mutableMapOf<String, List<Transaction>>()

    // Track last update time for each wallet
    private val lastUpdateTime = mutableMapOf<String, Long>()

    /**
     * Get cached transactions for a wallet address.
     * Returns null if no cache exists for this wallet.
     */
    suspend fun get(walletAddress: String): List<Transaction>? = mutex.withLock {
        cache[walletAddress]
    }

    /**
     * Update cache with new transactions, merging with existing ones.
     * New transactions are deduplicated by hash and merged with existing cache.
     * The list is sorted by timestamp (descending) and limited to maxSize.
     *
     * @param walletAddress The wallet address
     * @param newTransactions The new transactions to add/update
     * @param maxSize Maximum number of transactions to keep in cache (default 100)
     * @return The merged and sorted transaction list
     */
    suspend fun update(
        walletAddress: String,
        newTransactions: List<Transaction>,
        maxSize: Int = 100,
    ): List<Transaction> = mutex.withLock {
        val existing = cache[walletAddress] ?: emptyList()

        // Create a map of hash -> transaction for deduplication
        // New transactions take priority over existing ones (in case of updates)
        val transactionMap = mutableMapOf<String, Transaction>()

        // Add existing transactions first
        existing.forEach { tx ->
            transactionMap[tx.hash] = tx
        }

        // Add/update with new transactions (overwrites existing)
        newTransactions.forEach { tx ->
            transactionMap[tx.hash] = tx
        }

        // Convert back to list, sort by timestamp (descending), and limit size
        val merged = transactionMap.values
            .sortedByDescending { it.timestamp }
            .take(maxSize)

        // Update cache
        cache[walletAddress] = merged
        lastUpdateTime[walletAddress] = System.currentTimeMillis()

        Log.d(
            TAG,
            "TransactionCache updated for $walletAddress: " +
                "${existing.size} existing + ${newTransactions.size} new = ${merged.size} total " +
                "(${newTransactions.size - (merged.size - existing.size)} duplicates)",
        )

        merged
    }

    /**
     * Replace the entire cache for a wallet (useful for full refresh).
     */
    suspend fun replace(
        walletAddress: String,
        transactions: List<Transaction>,
        maxSize: Int = 100,
    ): List<Transaction> = mutex.withLock {
        val sorted = transactions
            .distinctBy { it.hash } // Deduplicate
            .sortedByDescending { it.timestamp }
            .take(maxSize)

        cache[walletAddress] = sorted
        lastUpdateTime[walletAddress] = System.currentTimeMillis()

        Log.d(TAG, "TransactionCache replaced for $walletAddress: ${sorted.size} transactions")

        sorted
    }

    /**
     * Clear cache for a specific wallet.
     */
    suspend fun clear(walletAddress: String) = mutex.withLock {
        cache.remove(walletAddress)
        lastUpdateTime.remove(walletAddress)
        Log.d(TAG, "TransactionCache cleared for $walletAddress")
    }

    /**
     * Clear all caches.
     */
    suspend fun clearAll() = mutex.withLock {
        cache.clear()
        lastUpdateTime.clear()
        Log.d(TAG, "TransactionCache cleared all")
    }

    /**
     * Get the last update time for a wallet (in milliseconds).
     */
    suspend fun getLastUpdateTime(walletAddress: String): Long? = mutex.withLock {
        lastUpdateTime[walletAddress]
    }

    /**
     * Check if cache is stale (older than maxAge milliseconds).
     */
    suspend fun isStale(walletAddress: String, maxAge: Long = 60_000L): Boolean = mutex.withLock {
        val lastUpdate = lastUpdateTime[walletAddress] ?: return@withLock true
        System.currentTimeMillis() - lastUpdate > maxAge
    }

    /**
     * Get cache statistics for debugging.
     */
    suspend fun getStats(): CacheStats = mutex.withLock {
        CacheStats(
            walletCount = cache.size,
            totalTransactions = cache.values.sumOf { it.size },
            oldestUpdate = lastUpdateTime.values.minOrNull() ?: 0L,
            newestUpdate = lastUpdateTime.values.maxOrNull() ?: 0L,
        )
    }

    companion object {
        private const val TAG = "TransactionCache"
    }
}

/**
 * Statistics about the transaction cache.
 */
data class CacheStats(
    val walletCount: Int,
    val totalTransactions: Int,
    val oldestUpdate: Long,
    val newestUpdate: Long,
)
