package io.ton.walletkit.demo.presentation.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import io.ton.walletkit.demo.presentation.model.SessionSummary
import io.ton.walletkit.demo.presentation.ui.preview.PreviewData
import io.ton.walletkit.demo.presentation.util.abbreviated

@Composable
fun SessionCard(session: SessionSummary, onDisconnect: () -> Unit) {
    ElevatedCard {
        Column(
            modifier = Modifier.padding(SESSION_CARD_PADDING),
            verticalArrangement = Arrangement.spacedBy(SESSION_CARD_CONTENT_SPACING),
        ) {
            Text(session.dAppName, style = MaterialTheme.typography.titleMedium)
            Column(verticalArrangement = Arrangement.spacedBy(SESSION_METADATA_SPACING)) {
                Text(
                    WALLET_LABEL,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(session.walletAddress.abbreviated(), style = MaterialTheme.typography.bodyMedium)
            }
            Row(
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(SESSION_URL_SPACING)) {
                    val resolvedUrl = session.dAppUrl?.takeIf { it.isNotBlank() }
                        ?: session.manifestUrl?.takeIf { it.isNotBlank() }
                    resolvedUrl?.let {
                        Text(
                            URL_LABEL,
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Text(
                            it,
                            style = MaterialTheme.typography.bodySmall,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                }
                TextButton(onClick = onDisconnect) { Text(DISCONNECT_LABEL) }
            }
        }
    }
}

private val SESSION_CARD_PADDING = 20.dp
private val SESSION_CARD_CONTENT_SPACING = 12.dp
private val SESSION_METADATA_SPACING = 4.dp
private val SESSION_URL_SPACING = 4.dp
private const val WALLET_LABEL = "Wallet"
private const val URL_LABEL = "URL"
private const val DISCONNECT_LABEL = "Disconnect"

@Preview(showBackground = true)
@Composable
private fun SessionCardPreview() {
    SessionCard(session = PreviewData.session, onDisconnect = {})
}
