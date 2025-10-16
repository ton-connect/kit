package io.ton.walletkit.demo.presentation.ui.sheet

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import io.ton.walletkit.demo.presentation.model.ConnectRequestUi
import io.ton.walletkit.demo.presentation.model.WalletSummary
import io.ton.walletkit.demo.presentation.ui.preview.PreviewData
import io.ton.walletkit.demo.presentation.util.abbreviated

@Composable
fun ConnectRequestSheet(
    request: ConnectRequestUi,
    wallets: List<WalletSummary>,
    onApprove: (WalletSummary) -> Unit,
    onReject: () -> Unit,
) {
    var selectedWallet by remember { mutableStateOf(wallets.firstOrNull()) }

    Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("Connect Request", style = MaterialTheme.typography.titleLarge)
        Text(request.dAppName, style = MaterialTheme.typography.titleMedium)
        Text(
            request.dAppUrl,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        if (request.permissions.isNotEmpty()) {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Requested permissions", style = MaterialTheme.typography.titleSmall)
                request.permissions.forEach { permission ->
                    AssistChip(onClick = {}, label = { Text(permission.title.ifBlank { permission.name }) })
                    Text(
                        permission.description,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }

        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Select wallet", style = MaterialTheme.typography.titleSmall)
            wallets.forEach { wallet ->
                ElevatedCard(
                    modifier = Modifier.clickable { selectedWallet = wallet },
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column {
                            Text(wallet.name, style = MaterialTheme.typography.titleMedium)
                            Text(wallet.address.abbreviated(), style = MaterialTheme.typography.bodySmall)
                        }
                        RadioIndicator(selected = selectedWallet?.address == wallet.address)
                    }
                }
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            TextButton(onClick = onReject, modifier = Modifier.weight(1f)) { Text("Reject") }
            Button(
                onClick = { selectedWallet?.let(onApprove) },
                enabled = selectedWallet != null,
                modifier = Modifier.weight(1f),
            ) { Text("Connect") }
        }
    }
}

@Composable
private fun RadioIndicator(selected: Boolean) {
    Box(
        modifier = Modifier
            .size(20.dp)
            .background(
                color = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant,
                shape = CircleShape,
            ),
        contentAlignment = Alignment.Center,
    ) {
        if (selected) {
            Box(
                modifier = Modifier
                    .size(10.dp)
                    .background(MaterialTheme.colorScheme.onPrimary, CircleShape),
            )
        }
    }
}

@Preview(showBackground = true)
@Composable
private fun ConnectRequestSheetPreview() {
    ConnectRequestSheet(
        request = PreviewData.connectRequest,
        wallets = listOf(PreviewData.wallet),
        onApprove = {},
        onReject = {},
    )
}
