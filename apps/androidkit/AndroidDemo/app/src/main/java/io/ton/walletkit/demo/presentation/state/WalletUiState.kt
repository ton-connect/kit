package io.ton.walletkit.demo.presentation.state

import io.ton.walletkit.demo.presentation.model.JettonSummary
import io.ton.walletkit.demo.presentation.model.SessionSummary
import io.ton.walletkit.demo.presentation.model.SignDataRequestUi
import io.ton.walletkit.demo.presentation.model.WalletSummary

data class WalletUiState(
    val initialized: Boolean = false,
    val status: String = "",
    val wallets: List<WalletSummary> = emptyList(),
    val activeWalletAddress: String? = null,
    val sessions: List<SessionSummary> = emptyList(),
    val sheetState: SheetState = SheetState.None,
    val previousSheet: SheetState? = null, // Used to restore sheet after modal interactions
    val isUrlPromptVisible: Boolean = false,
    val isWalletSwitcherExpanded: Boolean = false,
    val isLoadingWallets: Boolean = false,
    val isLoadingSessions: Boolean = false,
    val isLoadingTransactions: Boolean = false,
    val isSendingTransaction: Boolean = false,
    val isGeneratingMnemonic: Boolean = false,
    val error: String? = null,
    val events: List<String> = emptyList(),
    val lastUpdated: Long? = null,
    val clipboardContent: String? = null,
    val pendingSignerConfirmation: SignDataRequestUi? = null, // Request awaiting signer confirmation
    val jettons: List<JettonSummary> = emptyList(),
    val isLoadingJettons: Boolean = false,
    val jettonsError: String? = null,
    val canLoadMoreJettons: Boolean = false,
)
