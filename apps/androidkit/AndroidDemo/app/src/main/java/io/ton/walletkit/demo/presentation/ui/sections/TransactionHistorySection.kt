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
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import io.ton.walletkit.demo.presentation.ui.components.EmptyStateCard
import io.ton.walletkit.domain.model.Transaction
import io.ton.walletkit.domain.model.TransactionType
import java.math.BigDecimal
import org.json.JSONArray
import org.json.JSONObject
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
                    RECENT_TRANSACTIONS_TITLE,
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
                Text(if (isRefreshing) REFRESHING_LABEL else REFRESH_LABEL)
            }
        }

        if (transactions.isNullOrEmpty()) {
            EmptyStateCard(
                title = EMPTY_TRANSACTIONS_TITLE,
                description = EMPTY_TRANSACTIONS_DESCRIPTION,
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
                    contentDescription = if (isOutgoing) SENT_LABEL else RECEIVED_LABEL,
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
                    if (isOutgoing) SENT_LABEL else RECEIVED_LABEL,
                    style = MaterialTheme.typography.titleSmall,
                )
                Text(
                    formatTimestamp(timestamp),
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
                formatAmountLabel(amount, isOutgoing),
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

private fun isOutgoingTransaction(transaction: JSONObject, walletAddress: String): Boolean {
    // Check if the transaction has outgoing messages
    val outMsgs = transaction.optJSONArray("out_msgs")
    return outMsgs != null && outMsgs.length() > 0
}

private fun getTransactionAmount(transaction: JSONObject, isOutgoing: Boolean): String = try {
    if (isOutgoing) {
        // Sum all outgoing messages
        val outMsgs = transaction.optJSONArray("out_msgs")
        var total = 0L
        if (outMsgs != null) {
            for (i in 0 until outMsgs.length()) {
                val msg = outMsgs.optJSONObject(i)
                val value = msg?.optString("value")?.toLongOrNull() ?: 0L
                total += value
            }
        }
        formatNanoTon(total.toString())
    } else {
        // Get incoming message value
        val inMsg = transaction.optJSONObject("in_msg")
        val value = inMsg?.optString("value") ?: "0"
        formatNanoTon(value)
    }
} catch (e: Exception) {
    "0.0000"
}

private fun formatNanoTon(nanoTon: String): String = try {
    val value = runCatching { BigDecimal(nanoTon) }.getOrDefault(BigDecimal.ZERO)
    val ton = value.divide(NANO_TON_DIVISOR)
    String.format(Locale.US, TON_DECIMAL_FORMAT, ton)
} catch (e: Exception) {
    DEFAULT_TON_DISPLAY
}

private fun formatTimestamp(timestamp: Long): String = try {
    if (timestamp == 0L) {
        UNKNOWN_TIME_LABEL
    } else {
        // Timestamp is already in milliseconds from the bridge
        val date = Date(timestamp)
        val sdf = SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault())
        sdf.format(date)
    }
} catch (e: Exception) {
    UNKNOWN_TIME_LABEL
}

private fun formatAmountLabel(amount: String, isOutgoing: Boolean): String {
    val prefix = if (isOutgoing) OUTGOING_PREFIX else INCOMING_PREFIX
    return "$prefix${formatNanoTon(amount)}$TON_SUFFIX"
}

private const val RECENT_TRANSACTIONS_TITLE = "Recent Transactions"
private const val REFRESH_LABEL = "Refresh"
private const val REFRESHING_LABEL = "Refreshing…"
private const val EMPTY_TRANSACTIONS_TITLE = "No transactions"
private const val EMPTY_TRANSACTIONS_DESCRIPTION = "Your transaction history will appear here."
private const val SENT_LABEL = "Sent"
private const val RECEIVED_LABEL = "Received"
private const val UNKNOWN_TIME_LABEL = "Unknown time"
private const val TON_DECIMAL_FORMAT = "%.4f"
private const val DEFAULT_TON_DISPLAY = "0.0000"
private const val OUTGOING_PREFIX = "-"
private const val INCOMING_PREFIX = "+"
private const val TON_SUFFIX = " TON"
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
