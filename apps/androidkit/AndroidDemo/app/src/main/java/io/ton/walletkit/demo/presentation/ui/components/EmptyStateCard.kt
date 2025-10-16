package io.ton.walletkit.demo.presentation.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp

@Composable
fun EmptyStateCard(title: String, description: String) {
    Surface(
        shape = RoundedCornerShape(EMPTY_CARD_CORNER_RADIUS),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = EMPTY_CARD_SURFACE_ALPHA),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier.padding(EMPTY_CARD_PADDING),
            verticalArrangement = Arrangement.spacedBy(EMPTY_CARD_CONTENT_SPACING),
        ) {
            Text(title, style = MaterialTheme.typography.titleMedium)
            Text(
                description,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

private val EMPTY_CARD_PADDING = 20.dp
private val EMPTY_CARD_CONTENT_SPACING = 8.dp
private val EMPTY_CARD_CORNER_RADIUS = 16.dp
private const val EMPTY_CARD_SURFACE_ALPHA = 0.6f
private const val EMPTY_STATE_TITLE = "No wallets"
private const val EMPTY_STATE_DESCRIPTION = "Import or generate a wallet to get started."

@Preview(showBackground = true)
@Composable
private fun EmptyStateCardPreview() {
    EmptyStateCard(
        title = EMPTY_STATE_TITLE,
        description = EMPTY_STATE_DESCRIPTION,
    )
}
