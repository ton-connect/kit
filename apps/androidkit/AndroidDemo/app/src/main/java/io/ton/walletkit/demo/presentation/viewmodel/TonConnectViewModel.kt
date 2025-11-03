package io.ton.walletkit.demo.presentation.viewmodel

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import io.ton.walletkit.demo.presentation.model.ConnectRequestUi
import io.ton.walletkit.demo.presentation.model.SignDataRequestUi
import io.ton.walletkit.demo.presentation.model.TransactionRequestUi
import io.ton.walletkit.presentation.TONWallet
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * ViewModel for handling TON Connect protocol requests.
 * Manages connect, transaction, and sign data approval/rejection flows.
 */
class TonConnectViewModel(
    private val getWalletByAddress: (String) -> TONWallet?,
    private val onRequestApproved: () -> Unit = {},
    private val onRequestRejected: () -> Unit = {},
    private val onSessionsChanged: () -> Unit = {},
) : ViewModel() {

    private val _state = MutableStateFlow(TonConnectState())
    val state: StateFlow<TonConnectState> = _state.asStateFlow()

    data class TonConnectState(
        val isProcessing: Boolean = false,
        val error: String? = null,
        val successMessage: String? = null,
    )

    /**
     * Handle a TON Connect URL (universal link or QR code).
     */
    fun handleTonConnectUrl(url: String, walletAddress: String) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isProcessing = true, error = null)

            val wallet = getWalletByAddress(walletAddress)
            if (wallet == null) {
                _state.value = _state.value.copy(
                    isProcessing = false,
                    error = "Wallet not found",
                )
                return@launch
            }

            runCatching {
                wallet.connect(url.trim())
            }.onSuccess {
                _state.value = _state.value.copy(
                    isProcessing = false,
                    successMessage = "Connected successfully",
                )
                Log.d(TAG, "Handled TON Connect URL successfully")
            }.onFailure { error ->
                Log.e(TAG, "Failed to handle TON Connect URL", error)
                _state.value = _state.value.copy(
                    isProcessing = false,
                    error = error.message ?: "Failed to connect",
                )
            }
        }
    }

    /**
     * Approve a connection request from a dApp.
     */
    fun approveConnect(request: ConnectRequestUi, walletAddress: String) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isProcessing = true, error = null)

            runCatching {
                request.connectRequest?.approve(walletAddress)
                    ?: error("Connect request not available")
            }.onSuccess {
                _state.value = _state.value.copy(
                    isProcessing = false,
                    successMessage = "Connection approved",
                )
                onRequestApproved()
                onSessionsChanged()
                Log.d(TAG, "Approved connect request for ${request.dAppName}")
            }.onFailure { error ->
                Log.e(TAG, "Failed to approve connect", error)
                _state.value = _state.value.copy(
                    isProcessing = false,
                    error = error.message ?: "Failed to approve connection",
                )
            }
        }
    }

    /**
     * Reject a connection request from a dApp.
     */
    fun rejectConnect(request: ConnectRequestUi, reason: String = "User rejected") {
        viewModelScope.launch {
            _state.value = _state.value.copy(isProcessing = true, error = null)

            runCatching {
                request.connectRequest?.reject(reason)
                    ?: error("Connect request not available")
            }.onSuccess {
                _state.value = _state.value.copy(isProcessing = false)
                onRequestRejected()
                Log.d(TAG, "Rejected connect request for ${request.dAppName}")
            }.onFailure { error ->
                Log.e(TAG, "Failed to reject connect", error)
                _state.value = _state.value.copy(
                    isProcessing = false,
                    error = error.message ?: "Failed to reject connection",
                )
            }
        }
    }

    /**
     * Approve a transaction request from a dApp.
     */
    fun approveTransaction(request: TransactionRequestUi) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isProcessing = true, error = null)

            runCatching {
                request.transactionRequest?.approve()
                    ?: error("Transaction request not available")
            }.onSuccess {
                _state.value = _state.value.copy(
                    isProcessing = false,
                    successMessage = "Transaction approved",
                )
                onRequestApproved()
                onSessionsChanged()
                Log.d(TAG, "Approved transaction request ${request.id}")
            }.onFailure { error ->
                Log.e(TAG, "Failed to approve transaction", error)
                _state.value = _state.value.copy(
                    isProcessing = false,
                    error = error.message ?: "Failed to approve transaction",
                )
            }
        }
    }

    /**
     * Reject a transaction request from a dApp.
     */
    fun rejectTransaction(request: TransactionRequestUi, reason: String = "User rejected") {
        viewModelScope.launch {
            _state.value = _state.value.copy(isProcessing = true, error = null)

            runCatching {
                request.transactionRequest?.reject(reason)
                    ?: error("Transaction request not available")
            }.onSuccess {
                _state.value = _state.value.copy(isProcessing = false)
                onRequestRejected()
                Log.d(TAG, "Rejected transaction request ${request.id}")
            }.onFailure { error ->
                Log.e(TAG, "Failed to reject transaction", error)
                _state.value = _state.value.copy(
                    isProcessing = false,
                    error = error.message ?: "Failed to reject transaction",
                )
            }
        }
    }

    /**
     * Approve a sign data request from a dApp.
     */
    fun approveSignData(request: SignDataRequestUi) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isProcessing = true, error = null)

            runCatching {
                request.signDataRequest?.approve()
                    ?: error("Sign data request not available")
            }.onSuccess {
                _state.value = _state.value.copy(
                    isProcessing = false,
                    successMessage = "Data signed successfully",
                )
                onRequestApproved()
                Log.d(TAG, "Approved sign data request ${request.id}")
            }.onFailure { error ->
                Log.e(TAG, "Failed to approve sign data", error)
                _state.value = _state.value.copy(
                    isProcessing = false,
                    error = error.message ?: "Failed to sign data",
                )
            }
        }
    }

    /**
     * Reject a sign data request from a dApp.
     */
    fun rejectSignData(request: SignDataRequestUi, reason: String = "User rejected") {
        viewModelScope.launch {
            _state.value = _state.value.copy(isProcessing = true, error = null)

            runCatching {
                request.signDataRequest?.reject(reason)
                    ?: error("Sign data request not available")
            }.onSuccess {
                _state.value = _state.value.copy(isProcessing = false)
                onRequestRejected()
                Log.d(TAG, "Rejected sign data request ${request.id}")
            }.onFailure { error ->
                Log.e(TAG, "Failed to reject sign data", error)
                _state.value = _state.value.copy(
                    isProcessing = false,
                    error = error.message ?: "Failed to reject sign data",
                )
            }
        }
    }

    /**
     * Clear error or success message.
     */
    fun clearMessage() {
        _state.value = _state.value.copy(error = null, successMessage = null)
    }

    companion object {
        private const val TAG = "TonConnectViewModel"
    }
}
