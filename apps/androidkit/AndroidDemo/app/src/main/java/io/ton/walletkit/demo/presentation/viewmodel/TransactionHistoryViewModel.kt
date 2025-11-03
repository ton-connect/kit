package io.ton.walletkit.demo.presentation.viewmodel

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import io.ton.walletkit.demo.data.cache.TransactionCache
import io.ton.walletkit.demo.presentation.util.TransactionDiffUtil
import io.ton.walletkit.domain.model.Transaction
import io.ton.walletkit.presentation.TONWallet
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * ViewModel for managing transaction history for a wallet.
 * Handles loading, caching, and refreshing transactions.
 */
class TransactionHistoryViewModel(
    private val wallet: TONWallet,
    private val transactionCache: TransactionCache,
) : ViewModel() {
    private val _state = MutableStateFlow<TransactionState>(TransactionState.Initial)
    val state: StateFlow<TransactionState> = _state.asStateFlow()

    private val _transactions = MutableStateFlow<List<Transaction>>(emptyList())
    val transactions: StateFlow<List<Transaction>> = _transactions.asStateFlow()

    init {
        Log.d(TAG, "Created for wallet: ${wallet.address}")
    }

    override fun onCleared() {
        super.onCleared()
        Log.d(TAG, "Cleared for wallet: ${wallet.address}")
    }

    sealed class TransactionState {
        data object Initial : TransactionState()
        data object Loading : TransactionState()
        data object Empty : TransactionState()
        data object Success : TransactionState()
        data class Error(val message: String) : TransactionState()
    }

    /**
     * Load transactions for the wallet.
     * First shows cached transactions for immediate display, then fetches fresh data.
     */
    fun loadTransactions(limit: Int = DEFAULT_LIMIT) {
        viewModelScope.launch {
            try {
                val walletAddress = wallet.address ?: run {
                    _state.value = TransactionState.Error("Wallet address is null")
                    return@launch
                }

                _state.value = TransactionState.Loading

                // Try to get cached transactions first for immediate display
                val cachedTransactions = transactionCache.get(walletAddress)
                if (cachedTransactions != null && cachedTransactions.isNotEmpty()) {
                    Log.d(TAG, "Using cached transactions: ${cachedTransactions.size} items")
                    _transactions.value = cachedTransactions
                    _state.value = TransactionState.Success
                }

                // Fetch fresh transactions from network
                Log.d(TAG, "Fetching fresh transactions (limit=$limit)")
                val freshTransactions = wallet.transactions()

                // Merge with cache
                val mergedTransactions = transactionCache.update(walletAddress, freshTransactions)

                // Calculate diff for logging
                if (cachedTransactions != null && cachedTransactions.isNotEmpty()) {
                    val newItems = TransactionDiffUtil.getNewTransactions(cachedTransactions, mergedTransactions)
                    if (newItems.isNotEmpty()) {
                        Log.d(TAG, "Found ${newItems.size} new transactions")
                    }
                }

                _transactions.value = mergedTransactions

                if (mergedTransactions.isEmpty()) {
                    _state.value = TransactionState.Empty
                } else {
                    _state.value = TransactionState.Success
                }

                Log.d(TAG, "Loaded ${mergedTransactions.size} total transactions")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to load transactions", e)
                _state.value = TransactionState.Error(e.message ?: "Failed to load transactions")
            }
        }
    }

    /**
     * Refresh transactions from the network.
     */
    fun refresh() {
        _state.value = TransactionState.Initial
        loadTransactions()
    }

    /**
     * Clear cached transactions for this wallet.
     */
    fun clearCache() {
        viewModelScope.launch {
            val walletAddress = wallet.address ?: run {
                _state.value = TransactionState.Error("Wallet address is null")
                return@launch
            }
            transactionCache.clear(walletAddress)
            _transactions.value = emptyList()
            _state.value = TransactionState.Initial
        }
    }

    companion object {
        private const val TAG = "TransactionHistoryVM"
        private const val DEFAULT_LIMIT = 20
    }
}
