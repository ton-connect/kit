package io.ton.walletkit.demo.presentation.ui.sheet

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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import io.ton.walletkit.demo.R
import io.ton.walletkit.demo.presentation.model.SignDataRequestUi
import io.ton.walletkit.demo.presentation.ui.components.CodeBlock
import io.ton.walletkit.demo.presentation.ui.preview.PreviewData
import io.ton.walletkit.demo.presentation.util.abbreviated

@Composable
fun SignDataSheet(
    request: SignDataRequestUi,
    onApprove: () -> Unit,
    onReject: () -> Unit,
) {
    val clipboardManager = LocalClipboardManager.current

    Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text(stringResource(R.string.sign_request_title), style = MaterialTheme.typography.titleLarge)
        request.dAppName?.let {
            Text(stringResource(R.string.sign_request_from_format, it), style = MaterialTheme.typography.bodyMedium)
        }
        Text(stringResource(R.string.sign_request_wallet_format, request.walletAddress.abbreviated()), style = MaterialTheme.typography.bodyMedium)
        Text(stringResource(R.string.sign_request_type_format, request.payloadType), style = MaterialTheme.typography.bodyMedium)

        // Show preview if available (human-readable), otherwise show raw payload
        Text(stringResource(R.string.sign_request_data_hint), style = MaterialTheme.typography.titleSmall)
        Column(
            modifier = Modifier.clickable {
                clipboardManager.setText(AnnotatedString(request.payloadContent))
            },
        ) {
            CodeBlock(request.preview ?: request.payloadContent)
        }

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            TextButton(onClick = onReject, modifier = Modifier.weight(1f)) { Text(stringResource(R.string.action_reject)) }
            Button(onClick = onApprove, modifier = Modifier.weight(1f)) { Text(stringResource(R.string.action_sign)) }
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
