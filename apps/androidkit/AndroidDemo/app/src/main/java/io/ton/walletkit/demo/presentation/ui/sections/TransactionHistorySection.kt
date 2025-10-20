package io.ton.walletkit.demo.presentation.ui.sections

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.CallMade
import androidx.compose.material.icons.automirrored.filled.CallReceived
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.key
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import io.ton.walletkit.demo.R
import io.ton.walletkit.demo.presentation.ui.components.EmptyStateCard
import io.ton.walletkit.domain.model.Transaction
import io.ton.walletkit.domain.model.TransactionType
import java.math.BigDecimal
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun TransactionHistorySection(
    transactions: List<Transaction>?,
    walletAddress: String,
    isRefreshing: Boolean,
    onRefreshTransactions: () -> Unit,
    onTransactionClick: (String) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(HISTORY_SECTION_SPACING)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    stringResource(R.string.transactions_recent_title),
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onSurface,
                )
                Spacer(modifier = Modifier.width(HISTORY_TITLE_SPACING))
                transactions?.let {
                    Text(
                        "${it.size}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.primary,
                    )
                }
            }
            TextButton(
                onClick = onRefreshTransactions,
                enabled = !isRefreshing,
            ) {
                if (isRefreshing) {
                    CircularProgressIndicator(
                        modifier = Modifier
                            .size(REFRESH_INDICATOR_SIZE)
                            .padding(end = REFRESH_INDICATOR_PADDING),
                        strokeWidth = REFRESH_INDICATOR_STROKE,
                    )
                }
                Text(
                    if (isRefreshing) {
                        stringResource(R.string.transactions_refreshing)
                    } else {
                        stringResource(R.string.action_refresh)
                    },
                )
            }
        }

        if (transactions.isNullOrEmpty()) {
            EmptyStateCard(
                title = stringResource(R.string.transactions_empty_title),
                description = stringResource(R.string.transactions_empty_description),
            )
        } else {
            // Use Column with key() composable for efficient recomposition
            // Limited to 10 items, so no need for LazyColumn (which would cause infinite constraints)
            Column(verticalArrangement = Arrangement.spacedBy(TRANSACTION_LIST_SPACING)) {
                for (tx in transactions.take(10)) {
                    // Use key() to provide stable identity for efficient recomposition
                    key(tx.hash) {
                        TransactionItem(
                            transaction = tx,
                            walletAddress = walletAddress,
                            onClick = { onTransactionClick(tx.hash) },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun TransactionItem(
    transaction: Transaction,
    walletAddress: String,
    onClick: () -> Unit,
) {
    val isOutgoing = transaction.type == TransactionType.OUTGOING
    val amount = formatNanoTon(transaction.amount)
    val timestamp = transaction.timestamp
    val hash = transaction.hash

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(TRANSACTION_ITEM_PADDING),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            // Icon
            Box(
                modifier = Modifier
                    .size(TRANSACTION_ICON_SIZE)
                    .clip(CircleShape)
                    .background(
                        if (isOutgoing) {
                            MaterialTheme.colorScheme.errorContainer
                        } else {
                            MaterialTheme.colorScheme.primaryContainer
                        },
                    ),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = if (isOutgoing) {
                        Icons.AutoMirrored.Filled.CallMade
                    } else {
                        Icons.AutoMirrored.Filled.CallReceived
                    },
                    contentDescription = if (isOutgoing) {
                        stringResource(R.string.transactions_sent)
                    } else {
                        stringResource(R.string.transactions_received)
                    },
                    tint = if (isOutgoing) {
                        MaterialTheme.colorScheme.onErrorContainer
                    } else {
                        MaterialTheme.colorScheme.onPrimaryContainer
                    },
                    modifier = Modifier.size(TRANSACTION_ICON_INNER_SIZE),
                )
            }

            Spacer(modifier = Modifier.width(TRANSACTION_CONTENT_SPACING))

            // Transaction details
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    if (isOutgoing) {
                        stringResource(R.string.transactions_sent)
                    } else {
                        stringResource(R.string.transactions_received)
                    },
                    style = MaterialTheme.typography.titleSmall,
                )
                Text(
                    formatTimestamp(timestamp, stringResource(R.string.transactions_unknown_time)),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                if (hash.isNotEmpty()) {
                    Text(
                        hash.take(16) + "...",
                        style = MaterialTheme.typography.bodySmall,
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }

            // Amount
            Text(
                text = stringResource(
                    if (isOutgoing) {
                        R.string.transactions_amount_outgoing
                    } else {
                        R.string.transactions_amount_incoming
                    },
                    amount,
                ),
                style = MaterialTheme.typography.titleMedium,
                color = if (isOutgoing) {
                    MaterialTheme.colorScheme.error
                } else {
                    MaterialTheme.colorScheme.primary
                },
            )
        }
    }
}

private fun formatNanoTon(nanoTon: String): String = try {
    val value = runCatching { BigDecimal(nanoTon) }.getOrDefault(BigDecimal.ZERO)
    val ton = value.divide(NANO_TON_DIVISOR)
    String.format(Locale.US, TON_DECIMAL_FORMAT, ton)
} catch (_: Exception) {
    DEFAULT_TON_DISPLAY
}

private fun formatTimestamp(timestamp: Long, unknownLabel: String): String = try {
    if (timestamp == 0L) {
        unknownLabel
    } else {
        // Timestamp is already in milliseconds from the bridge
        val date = Date(timestamp)
        val sdf = SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault())
        sdf.format(date)
    }
} catch (_: Exception) {
    unknownLabel
}

private const val TON_DECIMAL_FORMAT = "%.4f"
private const val DEFAULT_TON_DISPLAY = "0.0000"
private val HISTORY_SECTION_SPACING = 12.dp
private val HISTORY_TITLE_SPACING = 8.dp
private val REFRESH_INDICATOR_SIZE = 16.dp
private val REFRESH_INDICATOR_PADDING = 8.dp
private val REFRESH_INDICATOR_STROKE = 2.dp
private val TRANSACTION_LIST_SPACING = 8.dp
private val TRANSACTION_ITEM_PADDING = 16.dp
private val TRANSACTION_ICON_SIZE = 40.dp
private val TRANSACTION_ICON_INNER_SIZE = 20.dp
private val TRANSACTION_CONTENT_SPACING = 12.dp
private val NANO_TON_DIVISOR = BigDecimal(1_000_000_000L)

@Preview(showBackground = true)
@Composable
private fun TransactionHistorySectionPreview() {
    val transactions = listOf(
        Transaction(
            hash = "hash1",
            timestamp = System.currentTimeMillis(),
            amount = "5000000000",
            fee = "10000000",
            comment = "Preview transaction",
            sender = "EQSender",
            recipient = "EQRecipient",
            type = TransactionType.OUTGOING,
            lt = "1",
            blockSeqno = 100,
        ),
        Transaction(
            hash = "hash2",
            timestamp = System.currentTimeMillis() - 3600_000,
            amount = "2500000000",
            fee = null,
            comment = null,
            sender = "EQSender2",
            recipient = "EQRecipient2",
            type = TransactionType.INCOMING,
            lt = "2",
            blockSeqno = 101,
        ),
    )

    TransactionHistorySection(
        transactions = transactions,
        walletAddress = "EQPreviewWallet",
        isRefreshing = false,
        onRefreshTransactions = {},
        onTransactionClick = {},
    )
}
