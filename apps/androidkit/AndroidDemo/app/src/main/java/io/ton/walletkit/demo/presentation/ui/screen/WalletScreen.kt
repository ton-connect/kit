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
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import io.ton.walletkit.demo.R
import io.ton.walletkit.demo.domain.model.WalletInterfaceType
import io.ton.walletkit.demo.presentation.actions.WalletActions
import io.ton.walletkit.demo.presentation.model.ConnectRequestUi
import io.ton.walletkit.demo.presentation.model.JettonDetails
import io.ton.walletkit.demo.presentation.model.JettonSummary
import io.ton.walletkit.demo.presentation.model.NFTDetails
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
import io.ton.walletkit.demo.presentation.ui.sections.JettonsSection
import io.ton.walletkit.demo.presentation.ui.sections.NFTsSection
import io.ton.walletkit.demo.presentation.ui.sections.SessionsSection
import io.ton.walletkit.demo.presentation.ui.sections.TransactionHistorySection
import io.ton.walletkit.demo.presentation.ui.sections.WalletsSection
import io.ton.walletkit.demo.presentation.ui.sheet.AddWalletSheet
import io.ton.walletkit.demo.presentation.ui.sheet.BrowserSheet
import io.ton.walletkit.demo.presentation.ui.sheet.ConnectRequestSheet
import io.ton.walletkit.demo.presentation.ui.sheet.JettonDetailsSheet
import io.ton.walletkit.demo.presentation.ui.sheet.SignDataSheet
import io.ton.walletkit.demo.presentation.ui.sheet.TransactionDetailSheet
import io.ton.walletkit.demo.presentation.ui.sheet.TransactionRequestSheet
import io.ton.walletkit.demo.presentation.ui.sheet.TransferJettonSheet
import io.ton.walletkit.demo.presentation.ui.sheet.WalletDetailsSheet
import io.ton.walletkit.demo.presentation.viewmodel.NFTsListViewModel
import io.ton.walletkit.model.TONNFTItem
import io.ton.walletkit.model.TONNetwork
import io.ton.walletkit.ITONWalletKit
import io.ton.walletkit.extensions.cleanupTonConnect

private const val DEFAULT_DAPP_URL = "https://tonconnect-sdk-demo-dapp.vercel.app/iframe/iframe"

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WalletScreen(
    state: WalletUiState,
    walletKit: ITONWalletKit,
    nftsViewModel: NFTsListViewModel?,
    actions: WalletActions,
) {
    val scrollState = rememberScrollState()
    val snackbarHostState = remember { SnackbarHostState() }

    // State for NFT details bottom sheet
    var selectedNFT by remember { mutableStateOf<TONNFTItem?>(null) }
    val nftDetailsSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

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
            onDismissRequest = actions::onDismissSheet,
            sheetState = sheetState,
            dragHandle = null,
        ) {
            when (sheet) {
                SheetState.AddWallet -> AddWalletSheet(
                    onDismiss = actions::onDismissSheet,
                    onImportWallet = actions::onImportWallet,
                    onGenerateWallet = actions::onGenerateWallet,
                    walletCount = state.wallets.size,
                )

                is SheetState.Connect -> ConnectRequestSheet(
                    request = sheet.request,
                    wallets = state.wallets,
                    onApprove = actions::onApproveConnect,
                    onReject = actions::onRejectConnect,
                )

                is SheetState.Transaction -> TransactionRequestSheet(
                    request = sheet.request,
                    onApprove = { actions.onApproveTransaction(sheet.request) },
                    onReject = { actions.onRejectTransaction(sheet.request) },
                )

                is SheetState.SignData -> SignDataSheet(
                    request = sheet.request,
                    onApprove = { actions.onApproveSignData(sheet.request) },
                    onReject = { actions.onRejectSignData(sheet.request) },
                )

                is SheetState.WalletDetails -> WalletDetailsSheet(
                    wallet = sheet.wallet,
                    onDismiss = actions::onDismissSheet,
                )

                is SheetState.SendTransaction -> SendTransactionScreen(
                    wallet = sheet.wallet,
                    onBack = actions::onDismissSheet,
                    onSend = { recipient, amount, comment ->
                        actions.onSendTransaction(sheet.wallet.address, recipient, amount, comment)
                    },
                    error = state.error,
                    isLoading = state.isSendingTransaction,
                )

                is SheetState.TransactionDetail -> TransactionDetailSheet(
                    transaction = sheet.transaction,
                    onDismiss = actions::onDismissSheet,
                )

                is SheetState.Browser -> BrowserSheet(
                    url = sheet.url,
                    onClose = actions::onDismissSheet,
                    walletKit = walletKit,
                    webViewHolder = browserWebViewHolder,
                )

                is SheetState.JettonDetails -> {
                    JettonDetailsSheet(
                        jetton = sheet.jetton,
                        onDismiss = actions::onDismissSheet,
                        onTransfer = { actions.onShowTransferJetton(sheet.jetton) },
                    )
                }

                is SheetState.TransferJetton -> {
                    TransferJettonSheet(
                        jetton = sheet.jetton,
                        onDismiss = actions::onDismissSheet,
                        onTransfer = { recipient, amount, comment ->
                            actions.onTransferJetton(sheet.jetton.jettonAddress ?: "", recipient, amount, comment)
                        },
                        isLoading = false,
                    )
                }

                SheetState.None -> Unit
            }
        }
    }

    if (state.isUrlPromptVisible) {
        UrlPromptDialog(
            onDismiss = actions::onDismissUrlPrompt,
            onConfirm = actions::onHandleUrl,
        )
    }

    // Show confirmation dialog for Signer wallets
    state.pendingSignerConfirmation?.let { request ->
        SignerConfirmationDialog(
            request = request,
            onConfirm = actions::onConfirmSignerApproval,
            onCancel = actions::onCancelSignerApproval,
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
                    IconButton(onClick = { actions.onOpenBrowser(DEFAULT_DAPP_URL) }) {
                        Icon(Icons.Default.Language, contentDescription = "Open dApp Browser")
                    }
                    IconButton(onClick = actions::onRefresh) {
                        Icon(Icons.Default.Refresh, contentDescription = stringResource(R.string.action_refresh))
                    }
                    IconButton(onClick = actions::onUrlPromptClick) {
                        Icon(Icons.Outlined.Link, contentDescription = stringResource(R.string.action_handle_url))
                    }
                    IconButton(onClick = actions::onAddWalletClick) {
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
                onHandleUrl = actions::onUrlPromptClick,
                onAddWallet = actions::onAddWalletClick,
                onRefresh = actions::onRefresh,
            )

            // Wallet Switcher (only show if multiple wallets exist)
            if (state.wallets.size > 1) {
                WalletSwitcher(
                    wallets = state.wallets,
                    activeWalletAddress = state.activeWalletAddress,
                    isExpanded = state.isWalletSwitcherExpanded,
                    onToggle = actions::onToggleWalletSwitcher,
                    onSwitchWallet = actions::onSwitchWallet,
                    onRemoveWallet = actions::onRemoveWallet,
                    onRenameWallet = actions::onRenameWallet,
                )
            }

            WalletsSection(
                activeWallet = activeWallet,
                totalWallets = state.wallets.size,
                onWalletSelected = actions::onWalletDetails,
                onSendFromWallet = actions::onSendFromWallet,
            )

            // Show NFTs for the active wallet (if ViewModel is available)
            if (nftsViewModel != null) {
                NFTsSection(
                    viewModel = nftsViewModel,
                    onNFTClick = { nft -> selectedNFT = nft },
                )
            }

            // Show Jettons for the active wallet
            JettonsSection(
                jettons = state.jettons,
                isLoading = state.isLoadingJettons,
                error = state.jettonsError,
                canLoadMore = state.canLoadMoreJettons,
                onJettonClick = actions::onShowJettonDetails,
                onLoadMore = actions::onLoadMoreJettons,
                onRefresh = actions::onRefreshJettons,
            )

            // Show transaction history for the active wallet
            activeWallet?.let { wallet ->
                TransactionHistorySection(
                    transactions = wallet.transactions,
                    walletAddress = wallet.address,
                    isRefreshing = state.isLoadingTransactions,
                    onRefreshTransactions = { actions.onRefreshTransactions(wallet.address) },
                    onTransactionClick = { hash -> actions.onTransactionClick(hash, wallet.address) },
                )
            }

            SessionsSection(
                sessions = state.sessions,
                onDisconnect = actions::onDisconnectSession,
            )

            if (state.events.isNotEmpty()) {
                EventLogSection(events = state.events)
            }

            Spacer(modifier = Modifier.height(48.dp))
        }
    }

    // NFT Details Modal Bottom Sheet (separate from main sheet state)
    selectedNFT?.let { nft ->
        ModalBottomSheet(
            onDismissRequest = { selectedNFT = null },
            sheetState = nftDetailsSheetState,
            dragHandle = null,
        ) {
            // Get the wallet to pass to NFTDetailsScreen
            activeWallet?.let { wallet ->
                val nftDetails = NFTDetails.from(nft)
                NFTDetailsScreen(
                    walletAddress = wallet.address,
                    walletKit = walletKit,
                    nftDetails = nftDetails,
                    onClose = { selectedNFT = null },
                    onTransferSuccess = {
                        // Refresh NFT list after successful transfer
                        nftsViewModel?.refresh()
                    },
                )
            }
        }
    }
}

// Preview temporarily disabled - requires ITONWalletKit instance
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
