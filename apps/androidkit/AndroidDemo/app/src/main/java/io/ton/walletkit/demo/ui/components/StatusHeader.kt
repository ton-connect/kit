package io.ton.walletkit.demo.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import io.ton.walletkit.demo.state.WalletUiState
import io.ton.walletkit.demo.ui.preview.PreviewData

@Composable
fun StatusHeader(state: WalletUiState) {
    val clipboardManager = LocalClipboardManager.current

    // Auto-copy to clipboard when clipboardContent is set
    LaunchedEffect(state.clipboardContent) {
        state.clipboardContent?.let { content ->
            clipboardManager.setText(AnnotatedString(content))
        }
    }

    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            text = state.status.ifBlank { "" },
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.SemiBold,
        )
        if (state.lastUpdated != null) {
            Text(
                text = "Updated just now",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Preview(showBackground = true)
@Composable
private fun StatusHeaderPreview() {
    StatusHeader(state = PreviewData.uiState)
}
