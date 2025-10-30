package io.ton.walletkit.demo.presentation.viewmodel

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import io.ton.walletkit.domain.model.TONNFTItem
import io.ton.walletkit.domain.model.TONPagination
import io.ton.walletkit.presentation.TONWallet
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * ViewModel for displaying NFTs owned by a wallet.
 */
class NFTsListViewModel(
    private val wallet: TONWallet,
) : ViewModel() {
    private val _state = MutableStateFlow<NFTState>(NFTState.Initial)
    val state: StateFlow<NFTState> = _state.asStateFlow()

    private val _nfts = MutableStateFlow<List<TONNFTItem>>(emptyList())
    val nfts: StateFlow<List<TONNFTItem>> = _nfts.asStateFlow()

    private val _isLoadingMore = MutableStateFlow(false)
    val isLoadingMore: StateFlow<Boolean> = _isLoadingMore.asStateFlow()

    private var pagination: TONPagination? = null
    private val limit = 10

    val canLoadMore: Boolean
        get() = pagination != null

    sealed class NFTState {
        data object Initial : NFTState()
        data object Loading : NFTState()
        data object Empty : NFTState()
        data object Success : NFTState()
        data class Error(val message: String) : NFTState()
    }

    fun loadNFTs() {
        if (_state.value != NFTState.Initial) return

        viewModelScope.launch {
            try {
                _state.value = NFTState.Loading

                val result = wallet.nfts(limit = limit, offset = 0)

                Log.d("NFTsListViewModel", "Loaded ${result.items.size} NFTs")
                result.items.forEachIndexed { index, nft ->
                    Log.d("NFTsListViewModel", "NFT[$index]: address=${nft.address}, name=${nft.metadata?.name}, image=${nft.metadata?.image}, extra=${nft.metadata?.extra}")
                }

                if (result.items.isEmpty()) {
                    _state.value = NFTState.Empty
                } else {
                    pagination = result.pagination
                    _nfts.value = result.items
                    _state.value = NFTState.Success
                }
            } catch (e: Exception) {
                Log.e("NFTsListViewModel", "Failed to load NFTs", e)
                _state.value = NFTState.Error(e.message ?: "Unknown error")
            }
        }
    }

    fun loadMoreNFTs() {
        val currentPagination = pagination ?: return
        if (_state.value != NFTState.Success || _isLoadingMore.value) return

        viewModelScope.launch {
            try {
                _isLoadingMore.value = true

                val result = wallet.nfts(
                    limit = limit,
                    offset = currentPagination.offset,
                )

                pagination = result.pagination
                // Only add NFTs that don't already exist (filter duplicates by address)
                val existingAddresses = _nfts.value.map { it.address }.toSet()
                val newNfts = result.items.filterNot { it.address in existingAddresses }
                _nfts.value = _nfts.value + newNfts
            } catch (e: Exception) {
                Log.e("NFTsListViewModel", "Failed to load more NFTs", e)
            } finally {
                _isLoadingMore.value = false
            }
        }
    }

    fun refresh() {
        _state.value = NFTState.Initial
        _nfts.value = emptyList()
        pagination = null
        loadNFTs()
    }
}
