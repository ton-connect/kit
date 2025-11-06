package io.ton.walletkit.demo.presentation.ui.sheet

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
import io.ton.walletkit.demo.presentation.model.JettonDetails
import io.ton.walletkit.demo.presentation.util.JettonFormatters
import java.math.BigDecimal

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TransferJettonSheet(
    jetton: JettonDetails,
    onDismiss: () -> Unit,
    onTransfer: (recipient: String, amount: String, comment: String) -> Unit,
    isLoading: Boolean = false,
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var recipient by remember { mutableStateOf("") }
    var amount by remember { mutableStateOf("") }
    var comment by remember { mutableStateOf("") }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp)
                .padding(bottom = 32.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp),
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "Transfer ${jetton.symbol}",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                )
                IconButton(onClick = onDismiss) {
                    Icon(Icons.Default.Close, contentDescription = "Close")
                }
            }

            // Jetton Info Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant,
                ),
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    // Jetton Icon
                    if (!jetton.imageSource.isNullOrEmpty()) {
                        AsyncImage(
                            model = jetton.imageSource,
                            contentDescription = jetton.name,
                            modifier = Modifier.size(40.dp),
                        )
                    } else {
                        Text(
                            text = "💰",
                            style = MaterialTheme.typography.headlineMedium,
                            modifier = Modifier.size(40.dp),
                        )
                    }

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = jetton.name,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                        )
                        Text(
                            text = JettonFormatters.formatAddress(jetton.jettonAddress ?: jetton.walletAddress),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }

                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = "Balance",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Text(
                            text = JettonFormatters.formatBalanceWithSymbol(jetton.balance, jetton.symbol, jetton.decimals),
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.SemiBold,
                        )
                    }
                }
            }

            // Recipient Address
            OutlinedTextField(
                value = recipient,
                onValueChange = { recipient = it },
                label = { Text("Recipient Address") },
                placeholder = { Text("EQ...") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                isError = recipient.isNotEmpty() && !isValidAddress(recipient),
                supportingText = {
                    if (recipient.isNotEmpty() && !isValidAddress(recipient)) {
                        Text("Invalid TON address")
                    }
                },
            )

            // Amount
            OutlinedTextField(
                value = amount,
                onValueChange = { amount = it },
                label = { Text("Amount") },
                placeholder = { Text("0.0") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                isError = amount.isNotEmpty() && !isValidJettonAmount(amount),
                supportingText = {
                    if (amount.isNotEmpty() && !isValidJettonAmount(amount)) {
                        Text("Invalid amount")
                    } else if (amount.isNotEmpty() && isJettonAmountTooLarge(amount, jetton.balance, jetton.decimals)) {
                        Text("Insufficient balance")
                    } else {
                        Text("Amount in ${jetton.symbol}")
                    }
                },
                trailingIcon = {
                    Text(
                        text = jetton.symbol,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                },
            )

            // Comment (Optional)
            OutlinedTextField(
                value = comment,
                onValueChange = { comment = it },
                label = { Text("Comment (Optional)") },
                placeholder = { Text("Add a message...") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = false,
                maxLines = 3,
                supportingText = {
                    Text("This comment will be visible on the blockchain")
                },
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Transfer Button
            Button(
                onClick = {
                    // Convert amount to raw units (considering decimals)
                    val rawAmount = convertToRawAmount(amount, jetton.decimals)
                    onTransfer(recipient, rawAmount, comment)
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = !isLoading &&
                    recipient.isNotEmpty() &&
                    isValidAddress(recipient) &&
                    amount.isNotEmpty() &&
                    isValidJettonAmount(amount) &&
                    !isJettonAmountTooLarge(amount, jetton.balance, jetton.decimals),
            ) {
                Text(
                    if (isLoading) "Transferring..." else "Transfer ${jetton.symbol}",
                )
            }

            // Info
            Text(
                text = "A small amount of TON will be used as a network fee for this transfer.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

private fun isValidAddress(address: String): Boolean = address.length > 10 && (address.startsWith("EQ") || address.startsWith("UQ"))

private fun isValidJettonAmount(amount: String): Boolean {
    return runCatching {
        val value = amount.toBigDecimalOrNull() ?: return false
        value > BigDecimal.ZERO
    }.getOrDefault(false)
}

private fun isJettonAmountTooLarge(amount: String, balance: String, decimals: Int): Boolean {
    return runCatching {
        val amountValue = amount.toBigDecimalOrNull() ?: return false
        val balanceValue = balance.toBigDecimalOrNull() ?: return true
        val divisor = BigDecimal.TEN.pow(decimals)
        val balanceDecimal = balanceValue / divisor
        amountValue > balanceDecimal
    }.getOrDefault(true)
}

private fun convertToRawAmount(amount: String, decimals: Int): String {
    return runCatching {
        val amountValue = amount.toBigDecimalOrNull() ?: return "0"
        val multiplier = BigDecimal.TEN.pow(decimals)
        (amountValue * multiplier).toBigInteger().toString()
    }.getOrDefault("0")
}
