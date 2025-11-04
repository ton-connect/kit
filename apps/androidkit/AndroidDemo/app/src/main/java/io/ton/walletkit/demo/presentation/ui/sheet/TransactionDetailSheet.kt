package io.ton.walletkit.demo.presentation.ui.sheet

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.CallMade
import androidx.compose.material.icons.automirrored.filled.CallReceived
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import io.ton.walletkit.demo.R
import io.ton.walletkit.demo.presentation.model.TransactionDetailUi
import io.ton.walletkit.demo.presentation.ui.preview.PreviewData
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TransactionDetailSheet(
    transaction: TransactionDetailUi,
    onDismiss: () -> Unit,
) {
    val context = LocalContext.current

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp)
                .padding(bottom = 32.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            // Header with icon and amount
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(CircleShape)
                        .background(
                            if (transaction.isOutgoing) {
                                MaterialTheme.colorScheme.errorContainer
                            } else {
                                MaterialTheme.colorScheme.primaryContainer
                            },
                        ),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = if (transaction.isOutgoing) {
                            Icons.AutoMirrored.Filled.CallMade
                        } else {
                            Icons.AutoMirrored.Filled.CallReceived
                        },
                        contentDescription = null,
                        tint = if (transaction.isOutgoing) {
                            MaterialTheme.colorScheme.onErrorContainer
                        } else {
                            MaterialTheme.colorScheme.onPrimaryContainer
                        },
                        modifier = Modifier.size(32.dp),
                    )
                }

                Text(
                    text = if (transaction.isOutgoing) {
                        stringResource(R.string.transactions_sent)
                    } else {
                        stringResource(R.string.transactions_received)
                    },
                    style = MaterialTheme.typography.titleLarge,
                )

                Text(
                    text = if (transaction.isOutgoing) {
                        stringResource(R.string.transactions_amount_outgoing, transaction.amount)
                    } else {
                        stringResource(R.string.transactions_amount_incoming, transaction.amount)
                    },
                    style = MaterialTheme.typography.displaySmall,
                    fontWeight = FontWeight.Bold,
                    color = if (transaction.isOutgoing) {
                        MaterialTheme.colorScheme.error
                    } else {
                        MaterialTheme.colorScheme.primary
                    },
                )

                Text(
                    formatFullTimestamp(transaction.timestamp, stringResource(R.string.transactions_unknown_time)),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Transaction details card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                ),
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    DetailRow(label = stringResource(R.string.transaction_detail_status_label), value = transaction.status)

                    HorizontalDivider()

                    DetailRow(
                        label = stringResource(R.string.transaction_detail_fee_label),
                        value = stringResource(R.string.wallet_switcher_balance_format, transaction.fee),
                    )

                    if (transaction.fromAddress != null) {
                        HorizontalDivider()
                        DetailRow(
                            label = stringResource(R.string.transaction_detail_from_label),
                            value = transaction.fromAddress,
                            isAddress = true,
                        )
                    }

                    if (transaction.toAddress != null) {
                        HorizontalDivider()
                        DetailRow(
                            label = stringResource(R.string.transaction_detail_to_label),
                            value = transaction.toAddress,
                            isAddress = true,
                        )
                    }

                    if (!transaction.comment.isNullOrBlank()) {
                        HorizontalDivider()
                        DetailRow(
                            label = stringResource(R.string.transaction_detail_comment_label),
                            value = transaction.comment,
                        )
                    }

                    HorizontalDivider()

                    DetailRow(
                        label = stringResource(R.string.transaction_detail_hash_label),
                        value = transaction.hash,
                        isAddress = true,
                    )

                    HorizontalDivider()

                    DetailRow(label = stringResource(R.string.transaction_detail_logical_time_label), value = transaction.lt)

                    HorizontalDivider()

                    DetailRow(label = stringResource(R.string.transaction_detail_block_label), value = transaction.blockSeqno.toString())
                }
            }

            // View on Blockchain button
            OutlinedButton(
                onClick = {
                    val url = "https://tonviewer.com/transaction/${transaction.hash}"
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    context.startActivity(intent)
                },
                modifier = Modifier.fillMaxWidth(),
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.OpenInNew,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp),
                )
                Spacer(modifier = Modifier.size(8.dp))
                Text(stringResource(R.string.transaction_detail_view_explorer))
            }

            // Close button
            TextButton(
                onClick = onDismiss,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(stringResource(R.string.action_close))
            }
        }
    }
}

@Composable
private fun DetailRow(
    label: String,
    value: String,
    isAddress: Boolean = false,
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontFamily = if (isAddress) FontFamily.Monospace else FontFamily.Default,
        )
    }
}

private fun formatFullTimestamp(timestamp: Long, unknownLabel: String): String = try {
    if (timestamp == 0L) {
        unknownLabel
    } else {
        val date = Date(timestamp) // Already in milliseconds from bridge
        val sdf = SimpleDateFormat("MMMM dd, yyyy 'at' HH:mm:ss", Locale.getDefault())
        sdf.format(date)
    }
} catch (e: Exception) {
    unknownLabel
}

@Preview(showBackground = true)
@Composable
private fun TransactionDetailSheetPreview() {
    MaterialTheme {
        TransactionDetailSheet(
            transaction = PreviewData.transactionDetail,
            onDismiss = {},
        )
    }
}
