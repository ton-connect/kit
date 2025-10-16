package io.ton.walletkit.demo.presentation.state

import io.ton.walletkit.demo.presentation.model.ConnectRequestUi
import io.ton.walletkit.demo.presentation.model.SignDataRequestUi
import io.ton.walletkit.demo.presentation.model.TransactionDetailUi
import io.ton.walletkit.demo.presentation.model.TransactionRequestUi
import io.ton.walletkit.demo.presentation.model.WalletSummary

sealed interface SheetState {
    data object None : SheetState
    data object AddWallet : SheetState
    data class Connect(val request: ConnectRequestUi) : SheetState
    data class Transaction(val request: TransactionRequestUi) : SheetState
    data class SignData(val request: SignDataRequestUi) : SheetState
    data class WalletDetails(val wallet: WalletSummary) : SheetState
    data class SendTransaction(val wallet: WalletSummary) : SheetState
    data class TransactionDetail(val transaction: TransactionDetailUi) : SheetState
}
