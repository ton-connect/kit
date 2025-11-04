package io.ton.walletkit.demo.presentation.actions

import io.ton.walletkit.demo.domain.model.WalletInterfaceType
import io.ton.walletkit.demo.presentation.model.ConnectRequestUi
import io.ton.walletkit.demo.presentation.model.JettonDetails
import io.ton.walletkit.demo.presentation.model.JettonSummary
import io.ton.walletkit.demo.presentation.model.SignDataRequestUi
import io.ton.walletkit.demo.presentation.model.TransactionRequestUi
import io.ton.walletkit.demo.presentation.model.WalletSummary
import io.ton.walletkit.model.TONNetwork

/**
 * Interface defining all wallet-related actions.
 * This consolidates the many callback parameters into a single injected dependency.
 */
interface WalletActions {
    fun onAddWalletClick()
    fun onUrlPromptClick()
    fun onOpenBrowser(url: String)
    fun onRefresh()
    fun onDismissSheet()
    fun onWalletDetails(address: String)
    fun onSendFromWallet(address: String)
    fun onDisconnectSession(sessionId: String)
    fun onToggleWalletSwitcher()
    fun onSwitchWallet(address: String)
    fun onRemoveWallet(address: String)
    fun onRenameWallet(address: String, newName: String)
    fun onImportWallet(name: String, network: TONNetwork, mnemonics: List<String>, password: String, interfaceType: WalletInterfaceType)
    fun onGenerateWallet(name: String, network: TONNetwork, password: String, interfaceType: WalletInterfaceType)
    fun onApproveConnect(request: ConnectRequestUi, wallet: WalletSummary)
    fun onRejectConnect(request: ConnectRequestUi)
    fun onApproveTransaction(request: TransactionRequestUi)
    fun onRejectTransaction(request: TransactionRequestUi)
    fun onApproveSignData(request: SignDataRequestUi)
    fun onRejectSignData(request: SignDataRequestUi)
    fun onConfirmSignerApproval()
    fun onCancelSignerApproval()
    fun onSendTransaction(walletAddress: String, recipient: String, amount: String, comment: String)
    fun onRefreshTransactions(address: String)
    fun onTransactionClick(transactionHash: String, walletAddress: String)
    fun onHandleUrl(url: String)
    fun onDismissUrlPrompt()
    fun onShowJettonDetails(jetton: JettonSummary)
    fun onTransferJetton(jettonAddress: String, recipient: String, amount: String, comment: String)
    fun onShowTransferJetton(jetton: JettonDetails)
    fun onLoadMoreJettons()
    fun onRefreshJettons()
}
