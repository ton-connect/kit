package io.ton.walletkit.demo.presentation.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp

@Composable
fun QuickActionsCard(
    onHandleUrl: () -> Unit,
    onAddWallet: () -> Unit,
    onRefresh: () -> Unit,
) {
    ElevatedCard {
        Column(
            modifier = Modifier.padding(ACTION_CARD_PADDING),
            verticalArrangement = Arrangement.spacedBy(ACTION_CARD_SPACING),
        ) {
            Text(QUICK_ACTIONS_TITLE, style = MaterialTheme.typography.titleMedium)
            Row(horizontalArrangement = Arrangement.spacedBy(ACTION_BUTTON_SPACING)) {
                FilledTonalButton(onClick = onHandleUrl) { Text(HANDLE_URL_LABEL) }
                FilledTonalButton(onClick = onAddWallet) { Text(ADD_WALLET_LABEL) }
                FilledTonalButton(onClick = onRefresh) { Text(REFRESH_LABEL) }
            }
        }
    }
}

private val ACTION_CARD_PADDING = 20.dp
private val ACTION_CARD_SPACING = 16.dp
private val ACTION_BUTTON_SPACING = 12.dp
private const val QUICK_ACTIONS_TITLE = "Quick Actions"
private const val HANDLE_URL_LABEL = "Handle URL"
private const val ADD_WALLET_LABEL = "Add Wallet"
private const val REFRESH_LABEL = "Refresh"

@Preview(showBackground = true)
@Composable
private fun QuickActionsCardPreview() {
    QuickActionsCard(onHandleUrl = {}, onAddWallet = {}, onRefresh = {})
}
