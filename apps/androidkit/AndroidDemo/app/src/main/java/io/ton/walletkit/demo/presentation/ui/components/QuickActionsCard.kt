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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import io.ton.walletkit.demo.R

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
            Text(stringResource(R.string.quick_actions_title), style = MaterialTheme.typography.titleMedium)
            Row(horizontalArrangement = Arrangement.spacedBy(ACTION_BUTTON_SPACING)) {
                FilledTonalButton(onClick = onHandleUrl) { Text(stringResource(R.string.action_handle_url)) }
                FilledTonalButton(onClick = onAddWallet) { Text(stringResource(R.string.action_add_wallet)) }
                FilledTonalButton(onClick = onRefresh) { Text(stringResource(R.string.action_refresh)) }
            }
        }
    }
}

private val ACTION_CARD_PADDING = 20.dp
private val ACTION_CARD_SPACING = 16.dp
private val ACTION_BUTTON_SPACING = 12.dp

@Preview(showBackground = true)
@Composable
private fun QuickActionsCardPreview() {
    QuickActionsCard(onHandleUrl = {}, onAddWallet = {}, onRefresh = {})
}
