package io.ton.walletkit.demo.presentation.ui.components

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
import io.ton.walletkit.demo.presentation.state.WalletUiState
import io.ton.walletkit.demo.presentation.ui.preview.PreviewData

@Composable
fun StatusHeader(state: WalletUiState) {
    val clipboardManager = LocalClipboardManager.current

    // Auto-copy to clipboard when clipboardContent is set
    LaunchedEffect(state.clipboardContent) {
        state.clipboardContent?.let { content ->
            clipboardManager.setText(AnnotatedString(content))
        }
    }

    Column(verticalArrangement = Arrangement.spacedBy(STATUS_HEADER_SPACING)) {
        Text(
            text = state.status.ifBlank { "" },
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.SemiBold,
        )
        if (state.lastUpdated != null) {
            Text(
                text = UPDATED_JUST_NOW_LABEL,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

private val STATUS_HEADER_SPACING = 8.dp
private const val UPDATED_JUST_NOW_LABEL = "Updated just now"

@Preview(showBackground = true)
@Composable
private fun StatusHeaderPreview() {
    StatusHeader(state = PreviewData.uiState)
}
