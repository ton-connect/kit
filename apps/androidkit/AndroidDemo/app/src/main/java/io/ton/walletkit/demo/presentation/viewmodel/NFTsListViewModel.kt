package io.ton.walletkit.demo.presentation.viewmodel

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import io.ton.walletkit.model.TONNFTItem
import io.ton.walletkit.model.TONPagination
import io.ton.walletkit.ITONWallet
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * ViewModel for displaying NFTs owned by a wallet.
 */
class NFTsListViewModel(
    private val wallet: ITONWallet,
) : ViewModel() {
    private val _state = MutableStateFlow<NFTState>(NFTState.Initial)
    val state: StateFlow<NFTState> = _state.asStateFlow()

    private val _nfts = MutableStateFlow<List<TONNFTItem>>(emptyList())
    val nfts: StateFlow<List<TONNFTItem>> = _nfts.asStateFlow()

    private val _isLoadingMore = MutableStateFlow(false)
    val isLoadingMore: StateFlow<Boolean> = _isLoadingMore.asStateFlow()

    private var pagination: TONPagination? = null
    private val limit = 10
    private var loadJob: Job? = null
    private var hasMoreItems = false // Track if there are more items to load

    init {
        Log.d("NFTsListViewModel", "Created for wallet: ${wallet.address}")
    }

    override fun onCleared() {
        super.onCleared()
        Log.d("NFTsListViewModel", "Cleared for wallet: ${wallet.address}")
        loadJob?.cancel()
    }

    val canLoadMore: Boolean
        get() = hasMoreItems

    sealed class NFTState {
        data object Initial : NFTState()
        data object Loading : NFTState()
        data object Empty : NFTState()
        data object Success : NFTState()
        data class Error(val message: String) : NFTState()
    }

    fun loadNFTs() {
        if (_state.value != NFTState.Initial) {
            Log.d("NFTsListViewModel", "Skipping loadNFTs - state is ${_state.value}, not Initial")
            return
        }

        Log.d("NFTsListViewModel", "Starting loadNFTs for wallet: ${wallet.address}")
        loadJob?.cancel() // Cancel any existing load operation
        loadJob = viewModelScope.launch {
            try {
                _state.value = NFTState.Loading

                val result = wallet.nfts(limit = limit, offset = 0)

                Log.d("NFTsListViewModel", "Loaded ${result.items.size} NFTs, pagination: ${result.pagination}")
                result.items.forEachIndexed { index, nft ->
                    Log.d("NFTsListViewModel", "NFT[$index]: address=${nft.address}, name=${nft.metadata?.name}, image=${nft.metadata?.image}")
                }

                if (result.items.isEmpty()) {
                    _state.value = NFTState.Empty
                    hasMoreItems = false
                } else {
                    pagination = result.pagination
                    _nfts.value = result.items
                    _state.value = NFTState.Success

                    // Check if there are more items based on whether we got a full page
                    hasMoreItems = result.items.size >= limit
                    Log.d("NFTsListViewModel", "hasMoreItems: $hasMoreItems (got ${result.items.size} items, limit=$limit)")
                }
            } catch (e: Exception) {
                Log.e("NFTsListViewModel", "Failed to load NFTs", e)
                _state.value = NFTState.Error(e.message ?: "Unknown error")
                hasMoreItems = false
            }
        }
    }

    fun loadMoreNFTs() {
        val currentPagination = pagination ?: return
        if (_state.value != NFTState.Success || _isLoadingMore.value) {
            Log.d("NFTsListViewModel", "Skipping loadMoreNFTs - state=${_state.value}, isLoadingMore=${_isLoadingMore.value}")
            return
        }

        Log.d("NFTsListViewModel", "Loading more NFTs with offset=${currentPagination.offset}, limit=$limit")
        viewModelScope.launch {
            try {
                _isLoadingMore.value = true

                val result = wallet.nfts(
                    limit = limit,
                    offset = currentPagination.offset,
                )

                Log.d("NFTsListViewModel", "Loaded ${result.items.size} more NFTs")

                pagination = result.pagination
                // Only add NFTs that don't already exist (filter duplicates by address)
                val existingAddresses = _nfts.value.map { it.address }.toSet()
                val newNfts = result.items.filterNot { it.address in existingAddresses }
                _nfts.value = _nfts.value + newNfts

                // Update hasMoreItems based on whether we got a full page
                hasMoreItems = result.items.size >= limit
                Log.d("NFTsListViewModel", "Added ${newNfts.size} new NFTs (filtered ${result.items.size - newNfts.size} duplicates), hasMoreItems=$hasMoreItems")
            } catch (e: Exception) {
                Log.e("NFTsListViewModel", "Failed to load more NFTs", e)
                hasMoreItems = false
            } finally {
                _isLoadingMore.value = false
            }
        }
    }

    fun refresh() {
        _state.value = NFTState.Initial
        _nfts.value = emptyList()
        pagination = null
        hasMoreItems = false
        loadNFTs()
    }
}
