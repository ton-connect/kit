package io.ton.walletkit.demo.presentation.viewmodel

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import io.ton.walletkit.model.TONJettonTransferParams
import io.ton.walletkit.model.TONJettonWallet
import io.ton.walletkit.model.TONPagination
import io.ton.walletkit.ITONWallet
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * ViewModel for displaying jettons owned by a wallet.
 * Handles jetton loading, pagination, and transfer operations.
 */
class JettonsListViewModel(
    private val wallet: ITONWallet,
) : ViewModel() {
    private val _state = MutableStateFlow<JettonState>(JettonState.Initial)
    val state: StateFlow<JettonState> = _state.asStateFlow()

    private val _jettons = MutableStateFlow<List<TONJettonWallet>>(emptyList())
    val jettons: StateFlow<List<TONJettonWallet>> = _jettons.asStateFlow()

    private val _isLoadingMore = MutableStateFlow(false)
    val isLoadingMore: StateFlow<Boolean> = _isLoadingMore.asStateFlow()

    private val _transferError = MutableStateFlow<String?>(null)
    val transferError: StateFlow<String?> = _transferError.asStateFlow()

    private var pagination: TONPagination? = null
    private val limit = 100
    private var loadJob: Job? = null
    private var hasMoreItems = false

    init {
        Log.d(TAG, "Created for wallet: ${wallet.address}")
    }

    override fun onCleared() {
        super.onCleared()
        Log.d(TAG, "Cleared for wallet: ${wallet.address}")
        loadJob?.cancel()
    }

    val canLoadMore: Boolean
        get() = hasMoreItems

    sealed class JettonState {
        data object Initial : JettonState()
        data object Loading : JettonState()
        data object Empty : JettonState()
        data object Success : JettonState()
        data class Error(val message: String) : JettonState()
    }

    /**
     * Load jettons for the wallet.
     */
    fun loadJettons() {
        if (_state.value != JettonState.Initial) {
            Log.d(TAG, "Skipping loadJettons - state is ${_state.value}, not Initial")
            return
        }

        Log.d(TAG, "Starting loadJettons for wallet: ${wallet.address}")
        loadJob?.cancel()
        loadJob = viewModelScope.launch {
            try {
                _state.value = JettonState.Loading

                val result = wallet.jettons(limit = limit, offset = 0)

                Log.d(TAG, "Loaded ${result.items.size} jettons, pagination: ${result.pagination}")
                result.items.forEachIndexed { index, jettonWallet ->
                    Log.d(TAG, "Jetton[$index]: address=${jettonWallet.jettonAddress}, balance=${jettonWallet.balance}, name=${jettonWallet.jetton?.name}")
                }

                if (result.items.isEmpty()) {
                    _state.value = JettonState.Empty
                    hasMoreItems = false
                } else {
                    pagination = result.pagination
                    _jettons.value = result.items
                    _state.value = JettonState.Success

                    // Check if there are more items based on pagination info
                    hasMoreItems = pagination?.let { p ->
                        p.offset + result.items.size < (p.pages ?: Int.MAX_VALUE)
                    } ?: false
                    Log.d(TAG, "hasMoreItems: $hasMoreItems (pagination=$pagination)")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to load jettons", e)
                _state.value = JettonState.Error(e.message ?: "Unknown error")
                hasMoreItems = false
            }
        }
    }

    /**
     * Load more jettons with pagination.
     */
    fun loadMoreJettons() {
        if (_state.value != JettonState.Success || _isLoadingMore.value || !hasMoreItems) {
            Log.d(TAG, "Skipping loadMoreJettons - state=${_state.value}, isLoadingMore=${_isLoadingMore.value}, hasMore=$hasMoreItems")
            return
        }

        val currentOffset = _jettons.value.size
        Log.d(TAG, "Loading more jettons with offset=$currentOffset, limit=$limit")

        viewModelScope.launch {
            try {
                _isLoadingMore.value = true

                val result = wallet.jettons(
                    limit = limit,
                    offset = currentOffset,
                )

                Log.d(TAG, "Loaded ${result.items.size} more jettons")

                pagination = result.pagination
                // Filter duplicates by jetton address
                val existingAddresses = _jettons.value.map { it.jettonAddress }.toSet()
                val newJettons = result.items.filterNot { it.jettonAddress in existingAddresses }
                _jettons.value = _jettons.value + newJettons

                // Update hasMoreItems based on pagination
                hasMoreItems = pagination?.let { p ->
                    p.offset + result.items.size < (p.pages ?: Int.MAX_VALUE)
                } ?: false
                Log.d(TAG, "Added ${newJettons.size} new jettons (filtered ${result.items.size - newJettons.size} duplicates), hasMoreItems=$hasMoreItems")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to load more jettons", e)
                hasMoreItems = false
            } finally {
                _isLoadingMore.value = false
            }
        }
    }

    /**
     * Refresh jettons from the beginning.
     */
    fun refresh() {
        _state.value = JettonState.Initial
        _jettons.value = emptyList()
        pagination = null
        hasMoreItems = false
        loadJettons()
    }

    /**
     * Transfer jetton to another address.
     *
     * @param jettonAddress The jetton master contract address
     * @param recipient The recipient wallet address
     * @param amount The amount to transfer (in jetton's smallest units)
     * @param comment Optional comment for the transfer
     */
    fun transferJetton(
        jettonAddress: String,
        recipient: String,
        amount: String,
        comment: String = "",
    ) {
        viewModelScope.launch {
            try {
                _transferError.value = null

                val transferParams = TONJettonTransferParams(
                    toAddress = recipient,
                    jettonAddress = jettonAddress,
                    amount = amount,
                    comment = comment.takeIf { it.isNotBlank() },
                )

                Log.i(TAG, "Creating jetton transfer transaction: jetton=$jettonAddress, to=$recipient, amount=$amount")

                // Create the jetton transfer transaction (step 1)
                val transactionBoc = wallet.createTransferJettonTransaction(transferParams)

                Log.i(TAG, "Jetton transfer transaction created, sending...")

                // Send the transaction (step 2)
                wallet.sendTransaction(transactionBoc)

                Log.i(TAG, "Jetton transfer transaction sent successfully")

                // Refresh jettons after delay to allow blockchain indexing
                delay(5000)
                refresh()
            } catch (e: Exception) {
                Log.e(TAG, "Failed to transfer jetton", e)
                _transferError.value = "Transfer failed: ${e.message}"
            }
        }
    }

    /**
     * Clear transfer error.
     */
    fun clearTransferError() {
        _transferError.value = null
    }

    companion object {
        private const val TAG = "JettonsListViewModel"
    }
}
