package io.ton.walletkit.demo.ui.sections

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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import io.ton.walletkit.demo.ui.components.EmptyStateCard
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun TransactionHistorySection(
    transactions: JSONArray?,
    walletAddress: String,
    isRefreshing: Boolean,
    onRefreshTransactions: () -> Unit,
    onTransactionClick: (String) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    "Recent Transactions",
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onSurface,
                )
                Spacer(modifier = Modifier.width(8.dp))
                transactions?.let {
                    Text(
                        "${it.length()}",
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
                            .size(16.dp)
                            .padding(end = 8.dp),
                        strokeWidth = 2.dp,
                    )
                }
                Text(if (isRefreshing) "Refreshing…" else "Refresh")
            }
        }

        if (transactions == null || transactions.length() == 0) {
            EmptyStateCard(
                title = "No transactions",
                description = "Your transaction history will appear here.",
            )
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                for (i in 0 until minOf(transactions.length(), 10)) {
                    val tx = transactions.optJSONObject(i) ?: continue
                    TransactionItem(
                        transaction = tx,
                        walletAddress = walletAddress,
                        onClick = { onTransactionClick(tx.optString("hash", "")) },
                    )
                }
            }
        }
    }
}

@Composable
private fun TransactionItem(
    transaction: JSONObject,
    walletAddress: String,
    onClick: () -> Unit,
) {
    val isOutgoing = isOutgoingTransaction(transaction, walletAddress)
    val amount = getTransactionAmount(transaction, isOutgoing)
    val timestamp = transaction.optLong("now", 0L) // Changed from "utime" to "now"
    val hash = transaction.optString("hash", "")

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            // Icon
            Box(
                modifier = Modifier
                    .size(40.dp)
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
                    contentDescription = if (isOutgoing) "Sent" else "Received",
                    tint = if (isOutgoing) {
                        MaterialTheme.colorScheme.onErrorContainer
                    } else {
                        MaterialTheme.colorScheme.onPrimaryContainer
                    },
                    modifier = Modifier.size(20.dp),
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            // Transaction details
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    if (isOutgoing) "Sent" else "Received",
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
                "${if (isOutgoing) "-" else "+"}$amount TON",
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
    val value = nanoTon.toLongOrNull() ?: 0L
    val ton = value.toDouble() / 1_000_000_000.0
    String.format(Locale.US, "%.4f", ton)
} catch (e: Exception) {
    "0.0000"
}

private fun formatTimestamp(timestamp: Long): String = try {
    if (timestamp == 0L) {
        "Unknown time"
    } else {
        val date = Date(timestamp * 1000)
        val sdf = SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault())
        sdf.format(date)
    }
} catch (e: Exception) {
    "Unknown time"
}
