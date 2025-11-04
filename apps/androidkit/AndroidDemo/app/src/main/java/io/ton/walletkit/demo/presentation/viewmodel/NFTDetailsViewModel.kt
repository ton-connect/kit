package io.ton.walletkit.demo.presentation.viewmodel

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import io.ton.walletkit.demo.presentation.model.NFTDetails
import io.ton.walletkit.domain.model.TONNFTTransferParamsHuman
import io.ton.walletkit.presentation.TONWallet
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class NFTDetailsViewModel(
    private val wallet: TONWallet,
    nftDetails: NFTDetails,
) : ViewModel() {

    private val _nftDetails = MutableStateFlow(nftDetails)
    val nftDetails: StateFlow<NFTDetails> = _nftDetails.asStateFlow()

    private val _isTransferring = MutableStateFlow(false)
    val isTransferring: StateFlow<Boolean> = _isTransferring.asStateFlow()

    private val _transferResult = MutableStateFlow<TransferResult?>(null)
    val transferResult: StateFlow<TransferResult?> = _transferResult.asStateFlow()

    sealed class TransferResult {
        data class Success(val txHash: String) : TransferResult()
        data class Error(val message: String) : TransferResult()
    }

    /**
     * Validates a TON address format
     * - Must be 48 characters long
     * - Must start with EQ or UQ
     * - Must be valid base64url characters
     */
    fun validateAddress(address: String): Boolean {
        if (address.length != 48) return false
        if (!address.startsWith("EQ") && !address.startsWith("UQ")) return false

        // Check for valid base64url characters
        val base64UrlRegex = Regex("^[A-Za-z0-9_-]+$")
        return base64UrlRegex.matches(address)
    }

    /**
     * Transfers the NFT to the specified address
     *
     * Uses the new 2-step process (matching iOS):
     * 1. Create transaction: wallet.transferNFT() returns transaction JSON
     * 2. Send to blockchain: wallet.sendTransaction(transactionJSON) returns hash
     */
    fun transfer(toAddress: String) {
        if (!validateAddress(toAddress)) {
            _transferResult.value = TransferResult.Error("Invalid TON address format")
            return
        }

        if (!nftDetails.value.canTransfer) {
            _transferResult.value = TransferResult.Error("This NFT cannot be transferred (on sale or missing owner)")
            return
        }

        viewModelScope.launch {
            try {
                _isTransferring.value = true
                _transferResult.value = null

                Log.d(TAG, "Creating NFT transfer transaction for ${nftDetails.value.contractAddress} to $toAddress")

                val params = TONNFTTransferParamsHuman(
                    nftAddress = nftDetails.value.contractAddress,
                    transferAmount = "50000000", // 0.05 TON in nanotons for gas
                    toAddress = toAddress,
                )

                // Step 1: Create the NFT transfer transaction
                val transactionJson = wallet.transferNFT(params)
                Log.d(TAG, "NFT transfer transaction created: $transactionJson")

                // Step 2: Send the transaction to the blockchain
                Log.d(TAG, "Sending NFT transfer transaction to blockchain...")
                val txHash = wallet.sendTransaction(transactionJson)
                Log.d(TAG, "NFT transfer successful! Transaction hash: $txHash")

                _transferResult.value = TransferResult.Success(txHash)
            } catch (e: Exception) {
                Log.e(TAG, "NFT transfer failed", e)
                _transferResult.value = TransferResult.Error(
                    e.message ?: "Unknown error during transfer",
                )
            } finally {
                _isTransferring.value = false
            }
        }
    }

    /**
     * Clears the transfer result (e.g., after showing a success/error message)
     */
    fun clearTransferResult() {
        _transferResult.value = null
    }

    override fun onCleared() {
        super.onCleared()
        Log.d(TAG, "NFTDetailsViewModel cleared")
    }

    companion object {
        private const val TAG = "NFTDetailsViewModel"

        fun factory(wallet: TONWallet, nftDetails: NFTDetails): ViewModelProvider.Factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T = NFTDetailsViewModel(wallet, nftDetails) as T
        }
    }
}
