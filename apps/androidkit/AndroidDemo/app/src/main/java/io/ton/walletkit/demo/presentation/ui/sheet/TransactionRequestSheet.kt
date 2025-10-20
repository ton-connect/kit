package io.ton.walletkit.demo.presentation.ui.sheet

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import io.ton.walletkit.demo.R
import io.ton.walletkit.demo.presentation.model.TransactionRequestUi
import io.ton.walletkit.demo.presentation.ui.preview.PreviewData
import io.ton.walletkit.demo.presentation.util.abbreviated
import java.math.BigDecimal
import java.math.RoundingMode
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun TransactionRequestSheet(
    request: TransactionRequestUi,
    onApprove: () -> Unit,
    onReject: () -> Unit,
) {
    Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        val isDirectSend = request.dAppName == UNKNOWN_DAPP_SENTINEL || request.dAppName.isBlank()
        val dAppNameDisplay = if (request.dAppName == UNKNOWN_DAPP_SENTINEL || request.dAppName.isBlank()) {
            stringResource(R.string.transaction_request_unknown_dapp)
        } else {
            request.dAppName
        }

        Text(
            if (isDirectSend) {
                stringResource(R.string.transaction_request_title_direct)
            } else {
                stringResource(
                    R.string.transaction_request_title_dapp,
                )
            },
            style = MaterialTheme.typography.titleLarge,
        )
        Text(
            stringResource(R.string.transaction_request_from_format, request.walletAddress.abbreviated()),
            style = MaterialTheme.typography.bodyMedium,
        )

        if (!isDirectSend) {
            Text(
                stringResource(R.string.transaction_request_requested_by_format, dAppNameDisplay),
                style = MaterialTheme.typography.bodyMedium,
            )
        }

        request.validUntil?.let {
            Text(
                stringResource(R.string.transaction_request_valid_until_format, formatUnixTimestamp(it)),
                style = MaterialTheme.typography.bodyMedium,
            )
        }

        if (request.messages.isNotEmpty()) {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                request.messages.forEachIndexed { index, message ->
                    Surface(shape = RoundedCornerShape(12.dp), tonalElevation = 2.dp) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                            ) {
                                Text(stringResource(R.string.transaction_request_to_label), style = MaterialTheme.typography.labelMedium)
                                Text(
                                    message.to.abbreviated(),
                                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium),
                                )
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                            ) {
                                Text(stringResource(R.string.transaction_request_amount_label), style = MaterialTheme.typography.labelMedium)
                                Text(
                                    stringResource(R.string.wallet_switcher_balance_format, formatNanoToTon(message.amount)),
                                    style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold),
                                )
                            }

                            // Show comment if present
                            message.comment?.takeIf { it.isNotBlank() }?.let {
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = CardDefaults.cardColors(
                                        containerColor = MaterialTheme.colorScheme.secondaryContainer,
                                    ),
                                ) {
                                    Column(modifier = Modifier.padding(12.dp)) {
                                        Text(
                                            stringResource(R.string.transaction_request_comment_label),
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onSecondaryContainer,
                                        )
                                        Text(
                                            it,
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = MaterialTheme.colorScheme.onSecondaryContainer,
                                        )
                                    }
                                }
                            }

                            message.payload?.takeIf { it.isNotBlank() }?.let {
                                val trimmedPayload = it.take(50) + if (it.length > 50) "..." else ""
                                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Text(
                                        stringResource(R.string.transaction_request_payload_label),
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                    Text(
                                        trimmedPayload,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // Note: Fee estimation removed - only shown in completed transactions

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            TextButton(onClick = onReject, modifier = Modifier.weight(1f)) { Text(stringResource(R.string.action_reject)) }
            Button(onClick = onApprove, modifier = Modifier.weight(1f)) { Text(stringResource(R.string.action_approve)) }
        }
    }
}

private fun formatNanoToTon(nanotons: String): String = try {
    BigDecimal(nanotons)
        .divide(BigDecimal("1000000000"), 9, RoundingMode.DOWN)
        .stripTrailingZeros()
        .toPlainString()
} catch (e: Exception) {
    nanotons
}

private fun formatUnixTimestamp(timestamp: Long): String = try {
    val date = Date(timestamp * 1000) // Convert from seconds to milliseconds
    val formatter = SimpleDateFormat("MMM dd, yyyy HH:mm:ss", Locale.getDefault())
    formatter.format(date)
} catch (e: Exception) {
    timestamp.toString()
}

private const val UNKNOWN_DAPP_SENTINEL = "Unknown dApp"

@Preview(showBackground = true)
@Composable
private fun TransactionRequestSheetPreview() {
    TransactionRequestSheet(
        request = PreviewData.transactionRequest,
        onApprove = {},
        onReject = {},
    )
}
