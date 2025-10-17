package io.ton.walletkit.demo.presentation.ui.dialog

import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import io.ton.walletkit.demo.R
import io.ton.walletkit.demo.presentation.model.SignDataRequestUi

@Composable
fun SignerConfirmationDialog(
    request: SignDataRequestUi,
    onConfirm: () -> Unit,
    onCancel: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = onCancel,
        confirmButton = {
            Button(onClick = onConfirm) {
                Text(stringResource(R.string.signer_confirm_button))
            }
        },
        dismissButton = {
            TextButton(onClick = onCancel) {
                Text(stringResource(R.string.action_cancel))
            }
        },
        title = {
            Text(stringResource(R.string.signer_confirm_title))
        },
        text = {
            Text(stringResource(R.string.signer_confirm_message))
        },
    )
}

@Preview(showBackground = true)
@Composable
private fun SignerConfirmationDialogPreview() {
    SignerConfirmationDialog(
        request = SignDataRequestUi(
            id = "preview-request",
            dAppName = "DApp Example",
            walletAddress = "EQDxyz...",
            payloadType = "Cell",
            payloadContent = "te6ccg...",
            preview = "Preview data",
            raw = org.json.JSONObject(),
        ),
        onConfirm = {},
        onCancel = {},
    )
}
