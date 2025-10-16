package io.ton.walletkit.demo.presentation.ui.dialog

import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.tooling.preview.Preview

@Composable
fun UrlPromptDialog(onDismiss: () -> Unit, onConfirm: (String) -> Unit) {
    var url by rememberSaveable { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            Button(
                onClick = {
                    onConfirm(url)
                    url = ""
                },
                enabled = url.isNotBlank(),
            ) { Text(HANDLE_BUTTON_LABEL) }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text(CANCEL_LABEL) } },
        title = { Text(HANDLE_URL_TITLE) },
        text = {
            TextField(
                value = url,
                onValueChange = { url = it },
                placeholder = { Text(URL_PLACEHOLDER) },
                singleLine = true,
            )
        },
    )
}

private const val HANDLE_BUTTON_LABEL = "Handle"
private const val CANCEL_LABEL = "Cancel"
private const val HANDLE_URL_TITLE = "Handle TON Connect URL"
private const val URL_PLACEHOLDER = "https:// or ton://"

@Preview(showBackground = true)
@Composable
private fun UrlPromptDialogPreview() {
    UrlPromptDialog(onDismiss = {}, onConfirm = {})
}
