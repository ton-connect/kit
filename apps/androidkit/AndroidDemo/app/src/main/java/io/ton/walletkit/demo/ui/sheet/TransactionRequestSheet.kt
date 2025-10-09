package io.ton.walletkit.demo.ui.sheet

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import io.ton.walletkit.demo.model.TransactionPreviewData
import io.ton.walletkit.demo.model.TransactionRequestUi
import io.ton.walletkit.demo.ui.components.CodeBlock
import io.ton.walletkit.demo.ui.preview.PreviewData
import io.ton.walletkit.demo.util.abbreviated
import java.math.BigDecimal
import java.math.RoundingMode

@Composable
fun TransactionRequestSheet(
    request: TransactionRequestUi,
    onApprove: () -> Unit,
    onReject: () -> Unit,
) {
    Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        val isDirectSend = request.dAppName == "Unknown dApp" || request.dAppName.isBlank()

        Text(
            if (isDirectSend) "Confirm Transaction" else "dApp Transaction Request",
            style = MaterialTheme.typography.titleLarge,
        )
        Text("From: ${request.walletAddress.abbreviated()}", style = MaterialTheme.typography.bodyMedium)

        if (!isDirectSend) {
            Text("Requested by: ${request.dAppName}", style = MaterialTheme.typography.bodyMedium)
        }

        request.validUntil?.let { Text("Valid until: $it", style = MaterialTheme.typography.bodyMedium) }

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
                                Text("To:", style = MaterialTheme.typography.labelMedium)
                                Text(
                                    message.to.abbreviated(),
                                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium),
                                )
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                            ) {
                                Text("Amount:", style = MaterialTheme.typography.labelMedium)
                                Text(
                                    "${formatNanoToTon(message.amount)} TON",
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
                                            "Comment:",
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
                                Text(
                                    "Payload: ${it.take(50)}${if (it.length > 50) "..." else ""}",
                                    style = MaterialTheme.typography.bodySmall,
                                )
                            }
                        }
                    }
                }
            }
        }

        // Fee information from preview
        val previewData = request.getPreviewData()
        when (previewData) {
            is TransactionPreviewData.Success -> {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primaryContainer,
                    ),
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            "Transaction Summary",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Text("Network Fee:", style = MaterialTheme.typography.bodyMedium)
                            Text(
                                "~${previewData.feeTon} TON",
                                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium),
                            )
                        }

                        Divider()

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Text(
                                "Total Cost:",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            )
                            Text(
                                "${previewData.totalCostTon} TON",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            )
                        }
                    }
                }
            }
            is TransactionPreviewData.Error -> {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer,
                    ),
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            "Fee Estimation Failed",
                            style = MaterialTheme.typography.titleSmall,
                            color = MaterialTheme.colorScheme.onErrorContainer,
                        )
                        Text(
                            previewData.message,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onErrorContainer,
                        )
                    }
                }
            }
            null -> {
                // No preview data, show raw preview if available
                request.preview?.let {
                    Text("Preview", style = MaterialTheme.typography.titleSmall)
                    CodeBlock(content = it)
                }
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            TextButton(onClick = onReject, modifier = Modifier.weight(1f)) { Text("Reject") }
            Button(onClick = onApprove, modifier = Modifier.weight(1f)) { Text("Approve") }
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

@Preview(showBackground = true)
@Composable
private fun TransactionRequestSheetPreview() {
    TransactionRequestSheet(
        request = PreviewData.transactionRequest,
        onApprove = {},
        onReject = {},
    )
}
