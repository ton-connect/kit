package io.ton.walletkit.demo.ui.sheet

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import io.ton.walletkit.demo.model.SignDataRequestUi
import io.ton.walletkit.demo.ui.components.CodeBlock
import io.ton.walletkit.demo.ui.preview.PreviewData
import io.ton.walletkit.demo.util.abbreviated

@Composable
fun SignDataSheet(
    request: SignDataRequestUi,
    onApprove: () -> Unit,
    onReject: () -> Unit,
) {
    val clipboardManager = LocalClipboardManager.current

    Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("Sign Data Request", style = MaterialTheme.typography.titleLarge)
        Text("Wallet: ${request.walletAddress.abbreviated()}", style = MaterialTheme.typography.bodyMedium)
        Text("Type: ${request.payloadType}", style = MaterialTheme.typography.bodyMedium)

        // Show preview if available (human-readable), otherwise show raw payload
        Text("Data to Sign (tap to copy)", style = MaterialTheme.typography.titleSmall)
        Column(
            modifier = Modifier.clickable {
                clipboardManager.setText(AnnotatedString(request.payloadContent))
            },
        ) {
            CodeBlock(request.preview ?: request.payloadContent)
        }

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            TextButton(onClick = onReject, modifier = Modifier.weight(1f)) { Text("Reject") }
            Button(onClick = onApprove, modifier = Modifier.weight(1f)) { Text("Sign") }
        }
    }
}

@Preview(showBackground = true)
@Composable
private fun SignDataSheetPreview() {
    SignDataSheet(
        request = PreviewData.signDataRequest,
        onApprove = {},
        onReject = {},
    )
}
