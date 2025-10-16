package io.ton.walletkit.demo.presentation.ui.sections

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import io.ton.walletkit.demo.presentation.model.WalletSummary
import io.ton.walletkit.demo.presentation.ui.components.EmptyStateCard
import io.ton.walletkit.demo.presentation.ui.components.WalletCard
import io.ton.walletkit.demo.presentation.ui.preview.PreviewData

@Composable
fun WalletsSection(
    activeWallet: WalletSummary?,
    totalWallets: Int,
    onWalletSelected: (String) -> Unit,
    onSendFromWallet: (String) -> Unit = {},
) {
    Column(verticalArrangement = Arrangement.spacedBy(WALLETS_SECTION_SPACING)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                ACTIVE_WALLET_TITLE,
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onSurface,
            )
            Spacer(modifier = Modifier.width(WALLETS_TITLE_SPACING))
            Text(
                walletCountLabel(totalWallets),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.primary,
            )
        }
        if (activeWallet == null) {
            EmptyStateCard(
                title = NO_WALLETS_TITLE,
                description = NO_WALLETS_DESCRIPTION,
            )
        } else {
            WalletCard(
                wallet = activeWallet,
                onDetails = { onWalletSelected(activeWallet.address) },
                onSend = { onSendFromWallet(activeWallet.address) },
            )
            if (totalWallets > 1) {
                Text(
                    text = WALLET_SWITCHER_HINT,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

private const val ACTIVE_WALLET_TITLE = "Active Wallet"
private const val NO_WALLETS_TITLE = "No wallets"
private const val NO_WALLETS_DESCRIPTION = "Import or generate a wallet to get started."
private const val WALLET_SWITCHER_HINT = "Use the wallet switcher to view other wallets."
private const val SINGULAR_WALLET_LABEL = "1 wallet"
private const val NO_WALLET_LABEL = "None"
private const val WALLET_SUFFIX = " wallets"
private val WALLETS_SECTION_SPACING = 12.dp
private val WALLETS_TITLE_SPACING = 8.dp

private fun walletCountLabel(count: Int): String = when (count) {
    0 -> NO_WALLET_LABEL
    1 -> SINGULAR_WALLET_LABEL
    else -> "$count$WALLET_SUFFIX"
}

@Preview(showBackground = true)
@Composable
private fun WalletsSectionPreview() {
    WalletsSection(
        activeWallet = PreviewData.wallet,
        totalWallets = 3,
        onWalletSelected = {},
        onSendFromWallet = {},
    )
}
