package io.ton.walletkit.demo.presentation.ui.components

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
fun CodeBlock(content: String) {
    Surface(
        shape = RoundedCornerShape(CODE_BLOCK_CORNER_RADIUS),
        color = MaterialTheme.colorScheme.surfaceVariant,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Text(
            text = content,
            modifier = Modifier.padding(CODE_BLOCK_PADDING),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

private val CODE_BLOCK_CORNER_RADIUS = 12.dp
private val CODE_BLOCK_PADDING = 16.dp

@Preview(showBackground = true)
@Composable
private fun CodeBlockPreview() {
    CodeBlock(content = "{\n  \"message\": \"Hello\"\n}")
}
