package io.ton.walletkit.demo.presentation.viewmodel

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import io.ton.walletkit.demo.presentation.state.BrowserUiState
import io.ton.walletkit.presentation.event.BrowserEvent
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/**
 * ViewModel for the internal dApp browser.
 * Handles browser events and state management.
 */
class BrowserViewModel : ViewModel() {

    private val _state = MutableStateFlow(BrowserUiState())
    val state: StateFlow<BrowserUiState> = _state.asStateFlow()

    fun handleBrowserEvent(event: BrowserEvent) {
        viewModelScope.launch {
            when (event) {
                is BrowserEvent.PageStarted -> {
                    Log.d(TAG, "Page started: ${event.url}")
                    _state.update {
                        it.copy(
                            isLoading = true,
                            currentUrl = event.url,
                            error = null,
                        )
                    }
                }

                is BrowserEvent.PageFinished -> {
                    Log.d(TAG, "Page finished: ${event.url}")
                    _state.update {
                        it.copy(
                            isLoading = false,
                        )
                    }
                }

                is BrowserEvent.Error -> {
                    Log.e(TAG, "Browser error: ${event.message}")
                    _state.update {
                        it.copy(
                            isLoading = false,
                            error = event.message,
                        )
                    }
                }

                is BrowserEvent.BridgeRequest -> {
                    Log.d(TAG, "Bridge request: ${event.method} (${event.messageId})")
                    _state.update {
                        it.copy(
                            lastRequest = "Request: ${event.method}",
                            requestCount = it.requestCount + 1,
                        )
                    }

                    // Note: The SDK automatically forwards this request to the WalletKit engine.
                    // The main WalletKitViewModel's event handlers will receive the actual
                    // connect/transaction/signData events through TONBridgeEventsHandler.
                    // This event is just for UI updates (showing notification, etc.)
                }
            }
        }
    }

    fun clearError() {
        _state.update { it.copy(error = null) }
    }

    companion object {
        private const val TAG = "BrowserViewModel"

        fun factory(): ViewModelProvider.Factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T = BrowserViewModel() as T
        }
    }
}
