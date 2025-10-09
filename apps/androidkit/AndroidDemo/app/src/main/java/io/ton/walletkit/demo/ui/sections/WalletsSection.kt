package io.ton.walletkit.demo.ui.sections

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
import io.ton.walletkit.demo.model.WalletSummary
import io.ton.walletkit.demo.ui.components.EmptyStateCard
import io.ton.walletkit.demo.ui.components.WalletCard
import io.ton.walletkit.demo.ui.preview.PreviewData

@Composable
fun WalletsSection(
    activeWallet: WalletSummary?,
    totalWallets: Int,
    onWalletSelected: (String) -> Unit,
    onSendFromWallet: (String) -> Unit = {},
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                "Active Wallet",
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onSurface,
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                when {
                    totalWallets == 0 -> "None"
                    totalWallets == 1 -> "1 wallet"
                    else -> "$totalWallets wallets"
                },
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.primary,
            )
        }
        if (activeWallet == null) {
            EmptyStateCard(
                title = "No wallets",
                description = "Import or generate a wallet to get started.",
            )
        } else {
            WalletCard(
                wallet = activeWallet,
                onDetails = { onWalletSelected(activeWallet.address) },
                onSend = { onSendFromWallet(activeWallet.address) },
            )
            if (totalWallets > 1) {
                Text(
                    text = "Use the wallet switcher to view other wallets.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
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
