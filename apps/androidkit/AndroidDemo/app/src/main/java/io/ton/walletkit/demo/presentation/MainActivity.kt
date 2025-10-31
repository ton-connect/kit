package io.ton.walletkit.demo.presentation

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import io.ton.walletkit.demo.core.TONWalletKitHelper
import io.ton.walletkit.demo.core.WalletKitDemoApp
import io.ton.walletkit.demo.presentation.ui.screen.SetupPasswordScreen
import io.ton.walletkit.demo.presentation.ui.screen.UnlockWalletScreen
import io.ton.walletkit.demo.presentation.ui.screen.WalletScreen
import io.ton.walletkit.demo.presentation.viewmodel.WalletKitViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: WalletKitViewModel by viewModels {
        val app = application as WalletKitDemoApp
        WalletKitViewModel.factory(app, app.storage, app.sdkEvents, app.sdkInitialized)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(color = MaterialTheme.colorScheme.background) {
                    AppNavigation(viewModel = viewModel)
                }
            }
        }
    }
}

@Composable
private fun AppNavigation(viewModel: WalletKitViewModel) {
    val isPasswordSet by viewModel.isPasswordSet.collectAsState()
    val isUnlocked by viewModel.isUnlocked.collectAsState()
    val state by viewModel.state.collectAsState()
    val nftsViewModel by viewModel.nftsViewModel.collectAsState()
    val hasWallet = state.wallets.isNotEmpty()

    // Get wallet kit instance for browser sheet
    val context = LocalContext.current
    val walletKit = remember { mutableStateOf<io.ton.walletkit.presentation.TONWalletKit?>(null) }

    LaunchedEffect(Unit) {
        val app = context.applicationContext as WalletKitDemoApp
        walletKit.value = TONWalletKitHelper.mainnet(app)
    }

    when {
        // Step 1: Setup password (first time user)
        !isPasswordSet -> {
            SetupPasswordScreen(
                onPasswordSet = { password ->
                    viewModel.setupPassword(password)
                },
                modifier = Modifier.fillMaxSize(),
            )
        }

        // Step 2: Unlock wallet (password set but locked)
        !isUnlocked -> {
            UnlockWalletScreen(
                onUnlock = { password ->
                    viewModel.unlockWallet(password)
                },
                onReset = {
                    viewModel.resetWallet()
                },
                modifier = Modifier.fillMaxSize(),
            )
        }

        // Step 3 & 4: Main wallet screen (unlocked)
        // The AddWalletSheet will be shown automatically if no wallets exist
        else -> {
            // Only show WalletScreen if walletKit is loaded
            walletKit.value?.let { kit ->
                WalletScreen(
                    state = state,
                    walletKit = kit,
                    nftsViewModel = nftsViewModel,
                    onAddWalletClick = viewModel::openAddWalletSheet,
                    onUrlPromptClick = viewModel::showUrlPrompt,
                    onOpenBrowser = { url -> viewModel.openBrowser(url) },
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
                    onConfirmSignerApproval = viewModel::confirmSignerApproval,
                    onCancelSignerApproval = viewModel::cancelSignerApproval,
                    onSendTransaction = viewModel::sendLocalTransaction,
                    onRefreshTransactions = viewModel::refreshTransactions,
                    onTransactionClick = viewModel::showTransactionDetail,
                    onHandleUrl = viewModel::handleTonConnectUrl,
                    onDismissUrlPrompt = viewModel::hideUrlPrompt,
                    onShowJettonDetails = viewModel::showJettonDetails,
                    onTransferJetton = viewModel::transferJetton,
                    onShowTransferJetton = viewModel::showTransferJetton,
                    onLoadMoreJettons = viewModel::loadMoreJettons,
                    onRefreshJettons = viewModel::refreshJettons,
                )
            }
        }
    }
}
