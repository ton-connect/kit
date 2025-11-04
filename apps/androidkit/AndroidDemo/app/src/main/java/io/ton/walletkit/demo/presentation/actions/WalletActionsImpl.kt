package io.ton.walletkit.demo.presentation.actions

import io.ton.walletkit.demo.domain.model.WalletInterfaceType
import io.ton.walletkit.demo.presentation.model.ConnectRequestUi
import io.ton.walletkit.demo.presentation.model.JettonDetails
import io.ton.walletkit.demo.presentation.model.JettonSummary
import io.ton.walletkit.demo.presentation.model.SignDataRequestUi
import io.ton.walletkit.demo.presentation.model.TransactionRequestUi
import io.ton.walletkit.demo.presentation.model.WalletSummary
import io.ton.walletkit.demo.presentation.viewmodel.WalletKitViewModel
import io.ton.walletkit.model.TONNetwork
import javax.inject.Inject

/**
 * Implementation of WalletActions that delegates to WalletKitViewModel.
 * This adapter allows the ViewModel to be injected as a single dependency instead of
 * passing 30+ individual callback parameters.
 */
class WalletActionsImpl @Inject constructor(
    private val viewModel: WalletKitViewModel,
) : WalletActions {

    override fun onAddWalletClick() = viewModel.openAddWalletSheet()

    override fun onUrlPromptClick() = viewModel.showUrlPrompt()

    override fun onOpenBrowser(url: String) = viewModel.openBrowser(url)

    override fun onRefresh() = viewModel.refreshAll()

    override fun onDismissSheet() = viewModel.dismissSheet()

    override fun onWalletDetails(address: String) = viewModel.showWalletDetails(address)

    override fun onSendFromWallet(address: String) = viewModel.openSendTransactionSheet(address)

    override fun onDisconnectSession(sessionId: String) = viewModel.disconnectSession(sessionId)

    override fun onToggleWalletSwitcher() = viewModel.toggleWalletSwitcher()

    override fun onSwitchWallet(address: String) = viewModel.switchWallet(address)

    override fun onRemoveWallet(address: String) = viewModel.removeWallet(address)

    override fun onRenameWallet(address: String, newName: String) = viewModel.renameWallet(address, newName)

    override fun onImportWallet(
        name: String,
        network: TONNetwork,
        mnemonics: List<String>,
        password: String,
        interfaceType: WalletInterfaceType,
    ) = viewModel.importWallet(name, network, mnemonics, password, interfaceType)

    override fun onGenerateWallet(
        name: String,
        network: TONNetwork,
        password: String,
        interfaceType: WalletInterfaceType,
    ) = viewModel.generateWallet(name, network, password, interfaceType)

    override fun onApproveConnect(request: ConnectRequestUi, wallet: WalletSummary) = viewModel.approveConnect(request, wallet)

    override fun onRejectConnect(request: ConnectRequestUi) = viewModel.rejectConnect(request)

    override fun onApproveTransaction(request: TransactionRequestUi) = viewModel.approveTransaction(request)

    override fun onRejectTransaction(request: TransactionRequestUi) = viewModel.rejectTransaction(request)

    override fun onApproveSignData(request: SignDataRequestUi) = viewModel.approveSignData(request)

    override fun onRejectSignData(request: SignDataRequestUi) = viewModel.rejectSignData(request)

    override fun onConfirmSignerApproval() = viewModel.confirmSignerApproval()

    override fun onCancelSignerApproval() = viewModel.cancelSignerApproval()

    override fun onSendTransaction(
        walletAddress: String,
        recipient: String,
        amount: String,
        comment: String,
    ) = viewModel.sendLocalTransaction(walletAddress, recipient, amount, comment)

    override fun onRefreshTransactions(address: String) = viewModel.refreshTransactions(address)

    override fun onTransactionClick(transactionHash: String, walletAddress: String) = viewModel.showTransactionDetail(transactionHash, walletAddress)

    override fun onHandleUrl(url: String) = viewModel.handleTonConnectUrl(url)

    override fun onDismissUrlPrompt() = viewModel.hideUrlPrompt()

    override fun onShowJettonDetails(jetton: JettonSummary) = viewModel.showJettonDetails(jetton)

    override fun onTransferJetton(
        jettonAddress: String,
        recipient: String,
        amount: String,
        comment: String,
    ) = viewModel.transferJetton(jettonAddress, recipient, amount, comment)

    override fun onShowTransferJetton(jetton: JettonDetails) = viewModel.showTransferJetton(jetton)

    override fun onLoadMoreJettons() = viewModel.loadMoreJettons()

    override fun onRefreshJettons() = viewModel.refreshJettons()
}
