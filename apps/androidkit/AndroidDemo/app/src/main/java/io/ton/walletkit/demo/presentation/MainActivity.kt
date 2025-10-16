package io.ton.walletkit.demo.presentation

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import io.ton.walletkit.demo.core.WalletKitDemoApp
import io.ton.walletkit.demo.presentation.viewmodel.WalletKitViewModel
import io.ton.walletkit.demo.presentation.ui.screen.WalletScreen

class MainActivity : ComponentActivity() {
    private val viewModel: WalletKitViewModel by viewModels {
        val app = application as WalletKitDemoApp
        WalletKitViewModel.factory(app.storage, app.sdkEvents, app.sdkInitialized)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(color = MaterialTheme.colorScheme.background) {
                    val state by viewModel.state.collectAsState()
                    WalletScreen(
                        state = state,
                        onAddWalletClick = viewModel::openAddWalletSheet,
                        onUrlPromptClick = viewModel::showUrlPrompt,
                        onRefresh = viewModel::refreshAll,
                        onDismissSheet = viewModel::dismissSheet,
                        onWalletDetails = viewModel::showWalletDetails,
                        onSendFromWallet = viewModel::openSendTransactionSheet,
                        onDisconnectSession = viewModel::disconnectSession,
                        onToggleWalletSwitcher = viewModel::toggleWalletSwitcher,
                        onSwitchWallet = viewModel::switchWallet,
                        onRemoveWallet = viewModel::removeWallet,
                        onRenameWallet = viewModel::renameWallet,
                        onImportWallet = viewModel::importWallet,
                        onGenerateWallet = viewModel::generateWallet,
                        onApproveConnect = viewModel::approveConnect,
                        onRejectConnect = viewModel::rejectConnect,
                        onApproveTransaction = viewModel::approveTransaction,
                        onRejectTransaction = viewModel::rejectTransaction,
                        onApproveSignData = viewModel::approveSignData,
                        onRejectSignData = viewModel::rejectSignData,
                        onSendTransaction = viewModel::sendTransaction,
                        onRefreshTransactions = viewModel::refreshTransactions,
                        onTransactionClick = viewModel::showTransactionDetail,
                        onHandleUrl = viewModel::handleTonConnectUrl,
                        onDismissUrlPrompt = viewModel::hideUrlPrompt,
                    )
                }
            }
        }
    }
}
