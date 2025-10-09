package io.ton.walletkit.demo.ui.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.outlined.Link
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import io.ton.walletkit.demo.model.ConnectRequestUi
import io.ton.walletkit.demo.model.SignDataRequestUi
import io.ton.walletkit.demo.model.TonNetwork
import io.ton.walletkit.demo.model.TransactionRequestUi
import io.ton.walletkit.demo.model.WalletSummary
import io.ton.walletkit.demo.state.SheetState
import io.ton.walletkit.demo.state.WalletUiState
import io.ton.walletkit.demo.ui.components.QuickActionsCard
import io.ton.walletkit.demo.ui.components.StatusHeader
import io.ton.walletkit.demo.ui.components.WalletSwitcher
import io.ton.walletkit.demo.ui.dialog.UrlPromptDialog
import io.ton.walletkit.demo.ui.preview.PreviewData
import io.ton.walletkit.demo.ui.screen.SendTransactionScreen
import io.ton.walletkit.demo.ui.sections.EventLogSection
import io.ton.walletkit.demo.ui.sections.SessionsSection
import io.ton.walletkit.demo.ui.sections.TransactionHistorySection
import io.ton.walletkit.demo.ui.sections.WalletsSection
import io.ton.walletkit.demo.ui.sheet.AddWalletSheet
import io.ton.walletkit.demo.ui.sheet.ConnectRequestSheet
import io.ton.walletkit.demo.ui.sheet.SignDataSheet
import io.ton.walletkit.demo.ui.sheet.TransactionRequestSheet
import io.ton.walletkit.demo.ui.sheet.WalletDetailsSheet

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WalletScreen(
    state: WalletUiState,
    onAddWalletClick: () -> Unit,
    onUrlPromptClick: () -> Unit,
    onRefresh: () -> Unit,
    onDismissSheet: () -> Unit,
    onWalletDetails: (String) -> Unit,
    onSendFromWallet: (String) -> Unit,
    onDisconnectSession: (String) -> Unit,
    onToggleWalletSwitcher: () -> Unit,
    onSwitchWallet: (String) -> Unit,
    onRemoveWallet: (String) -> Unit,
    onRenameWallet: (String, String) -> Unit,
    onImportWallet: (String, TonNetwork, List<String>, String) -> Unit,
    onGenerateWallet: (String, TonNetwork, String) -> Unit,
    onApproveConnect: (ConnectRequestUi, WalletSummary) -> Unit,
    onRejectConnect: (ConnectRequestUi) -> Unit,
    onApproveTransaction: (TransactionRequestUi) -> Unit,
    onRejectTransaction: (TransactionRequestUi) -> Unit,
    onApproveSignData: (SignDataRequestUi) -> Unit,
    onRejectSignData: (SignDataRequestUi) -> Unit,
    onTestSignDataText: (String) -> Unit,
    onTestSignDataBinary: (String) -> Unit,
    onTestSignDataCell: (String) -> Unit,
    onTestSignDataWithSession: (String, String) -> Unit,
    onTestSignDataBinaryWithSession: (String, String) -> Unit,
    onTestSignDataCellWithSession: (String, String) -> Unit,
    onSendTransaction: (walletAddress: String, recipient: String, amount: String, comment: String) -> Unit,
    onRefreshTransactions: (String) -> Unit,
    onTransactionClick: (transactionHash: String, walletAddress: String) -> Unit,
    onHandleUrl: (String) -> Unit,
    onDismissUrlPrompt: () -> Unit,
) {
    val scrollState = rememberScrollState()
    val snackbarHostState = remember { SnackbarHostState() }
    LaunchedEffect(state.error) {
        val error = state.error ?: return@LaunchedEffect
        snackbarHostState.showSnackbar(error)
    }

    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val sheet = state.sheetState
    val showSheet = sheet !is SheetState.None
    val activeWallet = state.wallets.firstOrNull { it.address == state.activeWalletAddress }
        ?: state.wallets.firstOrNull()
    if (showSheet) {
        ModalBottomSheet(
            onDismissRequest = onDismissSheet,
            sheetState = sheetState,
            dragHandle = null,
        ) {
            when (sheet) {
                SheetState.AddWallet -> AddWalletSheet(
                    onDismiss = onDismissSheet,
                    onImportWallet = onImportWallet,
                    onGenerateWallet = onGenerateWallet,
                    walletCount = state.wallets.size,
                )

                is SheetState.Connect -> ConnectRequestSheet(
                    request = sheet.request,
                    wallets = state.wallets,
                    onApprove = { wallet -> onApproveConnect(sheet.request, wallet) },
                    onReject = { onRejectConnect(sheet.request) },
                )

                is SheetState.Transaction -> TransactionRequestSheet(
                    request = sheet.request,
                    onApprove = { onApproveTransaction(sheet.request) },
                    onReject = { onRejectTransaction(sheet.request) },
                )

                is SheetState.SignData -> SignDataSheet(
                    request = sheet.request,
                    onApprove = { onApproveSignData(sheet.request) },
                    onReject = { onRejectSignData(sheet.request) },
                )

                is SheetState.WalletDetails -> WalletDetailsSheet(
                    wallet = sheet.wallet,
                    onDismiss = onDismissSheet,
                    onTestSignDataText = onTestSignDataText,
                    onTestSignDataBinary = onTestSignDataBinary,
                    onTestSignDataCell = onTestSignDataCell,
                    onTestSignDataWithSession = onTestSignDataWithSession,
                    onTestSignDataBinaryWithSession = onTestSignDataBinaryWithSession,
                    onTestSignDataCellWithSession = onTestSignDataCellWithSession,
                )

                is SheetState.SendTransaction -> SendTransactionScreen(
                    wallet = sheet.wallet,
                    onBack = onDismissSheet,
                    onSend = { recipient, amount, comment ->
                        onSendTransaction(sheet.wallet.address, recipient, amount, comment)
                    },
                    error = state.error,
                    isLoading = state.isSendingTransaction,
                )

                is SheetState.TransactionDetail -> io.ton.walletkit.demo.ui.sheet.TransactionDetailSheet(
                    transaction = sheet.transaction,
                    onDismiss = onDismissSheet,
                )

                SheetState.None -> Unit
            }
        }
    }

    if (state.isUrlPromptVisible) {
        UrlPromptDialog(
            onDismiss = onDismissUrlPrompt,
            onConfirm = onHandleUrl,
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "TonWallet Demo",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.SemiBold,
                    )
                },
                actions = {
                    IconButton(onClick = onRefresh) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                    IconButton(onClick = onUrlPromptClick) {
                        Icon(Icons.Outlined.Link, contentDescription = "Handle URL")
                    }
                    IconButton(onClick = onAddWalletClick) {
                        Icon(Icons.Default.Add, contentDescription = "Add Wallet")
                    }
                },
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(scrollState)
                .padding(horizontal = 20.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp),
        ) {
            if (state.isLoadingWallets || state.isLoadingSessions) {
                LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
            }
            StatusHeader(state)

            QuickActionsCard(
                onHandleUrl = onUrlPromptClick,
                onAddWallet = onAddWalletClick,
                onRefresh = onRefresh,
            )

            // Wallet Switcher (only show if multiple wallets exist)
            if (state.wallets.size > 1) {
                WalletSwitcher(
                    wallets = state.wallets,
                    activeWalletAddress = state.activeWalletAddress,
                    isExpanded = state.isWalletSwitcherExpanded,
                    onToggle = onToggleWalletSwitcher,
                    onSwitchWallet = onSwitchWallet,
                    onRemoveWallet = onRemoveWallet,
                    onRenameWallet = onRenameWallet,
                )
            }

            WalletsSection(
                activeWallet = activeWallet,
                totalWallets = state.wallets.size,
                onWalletSelected = onWalletDetails,
                onSendFromWallet = onSendFromWallet,
            )

            // Show transaction history for the active wallet
            activeWallet?.let { wallet ->
                TransactionHistorySection(
                    transactions = wallet.transactions,
                    walletAddress = wallet.address,
                    isRefreshing = state.isLoadingTransactions,
                    onRefreshTransactions = { onRefreshTransactions(wallet.address) },
                    onTransactionClick = { hash -> onTransactionClick(hash, wallet.address) },
                )
            }

            SessionsSection(
                sessions = state.sessions,
                onDisconnect = onDisconnectSession,
            )

            if (state.events.isNotEmpty()) {
                EventLogSection(events = state.events)
            }

            Spacer(modifier = Modifier.height(48.dp))
        }
    }
}

@Preview(showBackground = true)
@Composable
private fun WalletScreenPreview() {
    WalletScreen(
        state = PreviewData.uiState,
        onAddWalletClick = {},
        onUrlPromptClick = {},
        onRefresh = {},
        onDismissSheet = {},
        onWalletDetails = {},
        onSendFromWallet = {},
        onDisconnectSession = {},
        onToggleWalletSwitcher = {},
        onSwitchWallet = {},
        onRemoveWallet = {},
        onRenameWallet = { _, _ -> },
        onImportWallet = { _, _, _, _ -> },
        onGenerateWallet = { _, _, _ -> },
        onApproveConnect = { _, _ -> },
        onRejectConnect = {},
        onApproveTransaction = {},
        onRejectTransaction = {},
        onApproveSignData = {},
        onRejectSignData = {},
        onTestSignDataText = {},
        onTestSignDataBinary = {},
        onTestSignDataCell = {},
        onTestSignDataWithSession = { _, _ -> },
        onTestSignDataBinaryWithSession = { _, _ -> },
        onTestSignDataCellWithSession = { _, _ -> },
        onSendTransaction = { _, _, _, _ -> },
        onRefreshTransactions = {},
        onTransactionClick = { _, _ -> },
        onHandleUrl = {},
        onDismissUrlPrompt = {},
    )
}
