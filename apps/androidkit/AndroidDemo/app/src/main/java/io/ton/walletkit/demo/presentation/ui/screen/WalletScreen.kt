package io.ton.walletkit.demo.presentation.ui.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import androidx.compose.material.icons.filled.Language
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
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import io.ton.walletkit.demo.R
import io.ton.walletkit.demo.domain.model.WalletInterfaceType
import io.ton.walletkit.demo.presentation.model.ConnectRequestUi
import io.ton.walletkit.demo.presentation.model.SignDataRequestUi
import io.ton.walletkit.demo.presentation.model.TransactionRequestUi
import io.ton.walletkit.demo.presentation.model.WalletSummary
import io.ton.walletkit.demo.presentation.state.SheetState
import io.ton.walletkit.demo.presentation.state.WalletUiState
import io.ton.walletkit.demo.presentation.ui.components.QuickActionsCard
import io.ton.walletkit.demo.presentation.ui.components.StatusHeader
import io.ton.walletkit.demo.presentation.ui.components.WalletSwitcher
import io.ton.walletkit.demo.presentation.ui.dialog.SignerConfirmationDialog
import io.ton.walletkit.demo.presentation.ui.dialog.UrlPromptDialog
import io.ton.walletkit.demo.presentation.ui.preview.PreviewData
import io.ton.walletkit.demo.presentation.ui.sections.EventLogSection
import io.ton.walletkit.demo.presentation.ui.sections.SessionsSection
import io.ton.walletkit.demo.presentation.ui.sections.TransactionHistorySection
import io.ton.walletkit.demo.presentation.ui.sections.WalletsSection
import io.ton.walletkit.demo.presentation.ui.sheet.AddWalletSheet
import io.ton.walletkit.demo.presentation.ui.sheet.BrowserSheet
import io.ton.walletkit.demo.presentation.ui.sheet.ConnectRequestSheet
import io.ton.walletkit.demo.presentation.ui.sheet.SignDataSheet
import io.ton.walletkit.demo.presentation.ui.sheet.TransactionDetailSheet
import io.ton.walletkit.demo.presentation.ui.sheet.TransactionRequestSheet
import io.ton.walletkit.demo.presentation.ui.sheet.WalletDetailsSheet
import io.ton.walletkit.domain.model.TONNetwork
import io.ton.walletkit.presentation.TONWalletKit
import io.ton.walletkit.presentation.browser.cleanupTonConnect

private const val DEFAULT_DAPP_URL = "https://tonconnect-sdk-demo-dapp.vercel.app/iframe/iframe"

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WalletScreen(
    state: WalletUiState,
    walletKit: TONWalletKit,
    onAddWalletClick: () -> Unit,
    onUrlPromptClick: () -> Unit,
    onOpenBrowser: (String) -> Unit,
    onRefresh: () -> Unit,
    onDismissSheet: () -> Unit,
    onWalletDetails: (String) -> Unit,
    onSendFromWallet: (String) -> Unit,
    onDisconnectSession: (String) -> Unit,
    onToggleWalletSwitcher: () -> Unit,
    onSwitchWallet: (String) -> Unit,
    onRemoveWallet: (String) -> Unit,
    onRenameWallet: (String, String) -> Unit,
    onImportWallet: (String, TONNetwork, List<String>, String, WalletInterfaceType) -> Unit,
    onGenerateWallet: (String, TONNetwork, String, WalletInterfaceType) -> Unit,
    onApproveConnect: (ConnectRequestUi, WalletSummary) -> Unit,
    onRejectConnect: (ConnectRequestUi) -> Unit,
    onApproveTransaction: (TransactionRequestUi) -> Unit,
    onRejectTransaction: (TransactionRequestUi) -> Unit,
    onApproveSignData: (SignDataRequestUi) -> Unit,
    onRejectSignData: (SignDataRequestUi) -> Unit,
    onConfirmSignerApproval: () -> Unit,
    onCancelSignerApproval: () -> Unit,
    onSendTransaction: (walletAddress: String, recipient: String, amount: String, comment: String) -> Unit,
    onRefreshTransactions: (String) -> Unit,
    onTransactionClick: (transactionHash: String, walletAddress: String) -> Unit,
    onHandleUrl: (String) -> Unit,
    onDismissUrlPrompt: () -> Unit,
) {
    val scrollState = rememberScrollState()
    val snackbarHostState = remember { SnackbarHostState() }

    // Keep browser WebView alive across sheet changes to prevent destruction during TonConnect requests
    // This WebView persists even when switching to Connect/Transaction sheets
    val browserWebViewHolder = remember { mutableStateOf<android.webkit.WebView?>(null) }

    // Cleanup WebView when WalletScreen is disposed
    DisposableEffect(Unit) {
        onDispose {
            browserWebViewHolder.value?.let { webView ->
                // Clean up TonConnect resources before destroying WebView
                webView.cleanupTonConnect()
                webView.destroy()
            }
            browserWebViewHolder.value = null
        }
    }

    LaunchedEffect(state.error) {
        val error = state.error ?: return@LaunchedEffect
        snackbarHostState.showSnackbar(error)
    }

    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val sheet = state.sheetState
    val showSheet = sheet !is SheetState.None
    // Ensure the modal bottom sheet is hidden when the ViewModel clears the sheet state.
    LaunchedEffect(state.sheetState) {
        if (state.sheetState is SheetState.None && sheetState.isVisible) {
            // Animate hide to avoid leaving the sheet visible when it's removed from composition
            sheetState.hide()
        }
    }
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
                    onApprove = { req, wallet -> onApproveConnect(req, wallet) },
                    onReject = { req -> onRejectConnect(req) },
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

                is SheetState.TransactionDetail -> TransactionDetailSheet(
                    transaction = sheet.transaction,
                    onDismiss = onDismissSheet,
                )

                is SheetState.Browser -> BrowserSheet(
                    url = sheet.url,
                    onClose = onDismissSheet,
                    walletKit = walletKit,
                    webViewHolder = browserWebViewHolder,
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

    // Show confirmation dialog for Signer wallets
    state.pendingSignerConfirmation?.let { request ->
        SignerConfirmationDialog(
            request = request,
            onConfirm = onConfirmSignerApproval,
            onCancel = onCancelSignerApproval,
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = stringResource(R.string.wallet_screen_title),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.SemiBold,
                    )
                },
                actions = {
                    IconButton(onClick = { onOpenBrowser(DEFAULT_DAPP_URL) }) {
                        Icon(Icons.Default.Language, contentDescription = "Open dApp Browser")
                    }
                    IconButton(onClick = onRefresh) {
                        Icon(Icons.Default.Refresh, contentDescription = stringResource(R.string.action_refresh))
                    }
                    IconButton(onClick = onUrlPromptClick) {
                        Icon(Icons.Outlined.Link, contentDescription = stringResource(R.string.action_handle_url))
                    }
                    IconButton(onClick = onAddWalletClick) {
                        Icon(Icons.Default.Add, contentDescription = stringResource(R.string.action_add_wallet))
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
            // Always reserve space for progress indicator to prevent content shift
            Box(modifier = Modifier.fillMaxWidth().height(4.dp)) {
                if (state.isLoadingWallets || state.isLoadingSessions) {
                    LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
                }
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

// Preview temporarily disabled - requires TONWalletKit instance
// @Preview(showBackground = true)
// @Composable
// private fun WalletScreenPreview() {
//     WalletScreen(
//         state = PreviewData.uiState,
//         walletKit = ..., // TODO: Mock instance
//         onAddWalletClick = {},
//         ...
//     )
// }
