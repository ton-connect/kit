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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import io.ton.walletkit.demo.R

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
            ) { Text(stringResource(R.string.action_handle_url)) }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text(stringResource(R.string.action_cancel)) } },
        title = { Text(stringResource(R.string.url_prompt_title)) },
        text = {
            TextField(
                value = url,
                onValueChange = { url = it },
                placeholder = { Text(stringResource(R.string.url_prompt_placeholder)) },
                singleLine = true,
            )
        },
    )
}

@Preview(showBackground = true)
@Composable
private fun UrlPromptDialogPreview() {
    UrlPromptDialog(onDismiss = {}, onConfirm = {})
}
