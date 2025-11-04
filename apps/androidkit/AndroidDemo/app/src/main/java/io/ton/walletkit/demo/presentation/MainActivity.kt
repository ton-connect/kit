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
import dagger.hilt.android.AndroidEntryPoint
import io.ton.walletkit.demo.core.TONWalletKitHelper
import io.ton.walletkit.demo.core.WalletKitDemoApp
import io.ton.walletkit.demo.presentation.actions.WalletActionsImpl
import io.ton.walletkit.demo.presentation.ui.screen.SetupPasswordScreen
import io.ton.walletkit.demo.presentation.ui.screen.UnlockWalletScreen
import io.ton.walletkit.demo.presentation.ui.screen.WalletScreen
import io.ton.walletkit.demo.presentation.viewmodel.WalletKitViewModel
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    private val viewModel: WalletKitViewModel by viewModels()

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
private fun AppNavigation(
    viewModel: WalletKitViewModel,
) {
    val isPasswordSet by viewModel.isPasswordSet.collectAsState()
    val isUnlocked by viewModel.isUnlocked.collectAsState()
    val state by viewModel.state.collectAsState()
    val nftsViewModel by viewModel.nftsViewModel.collectAsState()
    val hasWallet = state.wallets.isNotEmpty()

    // Get wallet kit instance for browser sheet
    val context = LocalContext.current
    val walletKit = remember { mutableStateOf<io.ton.walletkit.ITONWalletKit?>(null) }

    LaunchedEffect(Unit) {
        val app = context.applicationContext as WalletKitDemoApp
        walletKit.value = TONWalletKitHelper.mainnet(app)
    }

    // Create WalletActions implementation
    val walletActions = remember(viewModel) { WalletActionsImpl(viewModel) }

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
            walletKit.value?.let { kit ->
                WalletScreen(
                    state = state,
                    walletKit = kit,
                    nftsViewModel = nftsViewModel,
                    actions = walletActions,
                )
            }
        }
    }
}
