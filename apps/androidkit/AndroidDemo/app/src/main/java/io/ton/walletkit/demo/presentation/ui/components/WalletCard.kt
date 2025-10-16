package io.ton.walletkit.demo.presentation.ui.components

import android.content.ClipData
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material3.Button
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ClipEntry
import androidx.compose.ui.platform.LocalClipboard
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import io.ton.walletkit.demo.presentation.model.WalletSummary
import io.ton.walletkit.demo.presentation.ui.preview.PreviewData
import io.ton.walletkit.demo.presentation.util.abbreviated
import kotlinx.coroutines.launch

@Composable
fun WalletCard(
    wallet: WalletSummary,
    onDetails: () -> Unit,
    onSend: () -> Unit = {},
) {
    val clipboard = LocalClipboard.current
    val coroutineScope = rememberCoroutineScope()
    ElevatedCard {
        Column(
            modifier = Modifier.padding(WALLET_CARD_PADDING),
            verticalArrangement = Arrangement.spacedBy(WALLET_CARD_SECTION_SPACING),
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(WALLET_CARD_LABEL_SPACING)) {
                    Text(wallet.name, style = MaterialTheme.typography.titleMedium)
                    NetworkBadge(wallet.network)
                }
                TextButton(onClick = onDetails) { Text(DETAILS_LABEL) }
            }

            Column(verticalArrangement = Arrangement.spacedBy(WALLET_CARD_CONTENT_SPACING)) {
                Text(
                    ADDRESS_LABEL,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = wallet.address.abbreviated(),
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.weight(1f),
                    )
                    IconButton(
                        onClick = {
                            coroutineScope.launch {
                                clipboard.setClipEntry(
                                    ClipEntry(ClipData.newPlainText(CLIPBOARD_WALLET_ADDRESS_LABEL, wallet.address)),
                                )
                            }
                        },
                    ) {
                        Icon(Icons.Default.ContentCopy, contentDescription = COPY_ADDRESS_CONTENT_DESCRIPTION)
                    }
                }
            }

            Column(verticalArrangement = Arrangement.spacedBy(WALLET_CARD_LABEL_SPACING)) {
                Text(
                    BALANCE_LABEL,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(wallet.balance ?: DEFAULT_BALANCE_VALUE, style = MaterialTheme.typography.headlineSmall)
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(WALLET_CARD_BUTTON_SPACING),
            ) {
                Button(
                    onClick = onSend,
                    modifier = Modifier.weight(1f),
                ) {
                    Icon(
                        Icons.AutoMirrored.Filled.Send,
                        contentDescription = null,
                        modifier = Modifier.padding(end = SEND_ICON_PADDING),
                    )
                    Text(SEND_BUTTON_LABEL)
                }
            }
        }
    }
}

private val WALLET_CARD_PADDING = 20.dp
private val WALLET_CARD_SECTION_SPACING = 12.dp
private val WALLET_CARD_CONTENT_SPACING = 8.dp
private val WALLET_CARD_LABEL_SPACING = 4.dp
private val WALLET_CARD_BUTTON_SPACING = 8.dp
private val SEND_ICON_PADDING = 4.dp
private const val DETAILS_LABEL = "Details"
private const val ADDRESS_LABEL = "Address"
private const val BALANCE_LABEL = "Balance"
private const val SEND_BUTTON_LABEL = "Send"
private const val COPY_ADDRESS_CONTENT_DESCRIPTION = "Copy address"
private const val DEFAULT_BALANCE_VALUE = "—"
private const val CLIPBOARD_WALLET_ADDRESS_LABEL = "wallet_address"

@Preview(showBackground = true)
@Composable
private fun WalletCardPreview() {
    WalletCard(wallet = PreviewData.wallet, onDetails = {}, onSend = {})
}
