package io.ton.walletkit.demo.state

import io.ton.walletkit.demo.model.ConnectRequestUi
import io.ton.walletkit.demo.model.SignDataRequestUi
import io.ton.walletkit.demo.model.TransactionDetailUi
import io.ton.walletkit.demo.model.TransactionRequestUi
import io.ton.walletkit.demo.model.WalletSummary

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
