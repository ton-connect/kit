package io.ton.walletkit.demo.ui.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import io.ton.walletkit.demo.model.WalletSummary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SendTransactionScreen(
    wallet: WalletSummary,
    onBack: () -> Unit,
    onSend: (recipient: String, amount: String, comment: String) -> Unit,
    error: String?,
    isLoading: Boolean,
) {
    var recipient by remember { mutableStateOf("") }
    var amount by remember { mutableStateOf("") }
    var comment by remember { mutableStateOf("") }
    val snackbarHostState = remember { SnackbarHostState() }
    val scrollState = rememberScrollState()

    LaunchedEffect(error) {
        error?.let {
            snackbarHostState.showSnackbar(it)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Send TON",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.SemiBold,
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(scrollState)
                .padding(horizontal = 20.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp),
        ) {
            // Wallet Info
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    "From",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(
                    wallet.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    "Balance: ${wallet.balance ?: "0"} TON",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }

            // Recipient Address
            OutlinedTextField(
                value = recipient,
                onValueChange = { recipient = it },
                label = { Text("Recipient Address") },
                placeholder = { Text("EQ... or UQ...") },
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
                label = { Text("Amount (TON)") },
                placeholder = { Text("0.00") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                isError = amount.isNotEmpty() && !isValidAmount(amount),
                supportingText = {
                    if (amount.isNotEmpty() && !isValidAmount(amount)) {
                        Text("Invalid amount")
                    } else if (amount.isNotEmpty() && isAmountTooLarge(amount, wallet.balance)) {
                        Text("Insufficient balance")
                    }
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
                    Text("This message will be visible on the blockchain")
                },
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Send Button
            Button(
                onClick = { onSend(recipient, amount, comment) },
                modifier = Modifier.fillMaxWidth(),
                enabled = !isLoading &&
                    recipient.isNotEmpty() &&
                    isValidAddress(recipient) &&
                    amount.isNotEmpty() &&
                    isValidAmount(amount) &&
                    !isAmountTooLarge(amount, wallet.balance),
            ) {
                Text(if (isLoading) "Sending..." else "Send Transaction")
            }

            // Info
            Text(
                "This will create and send a transaction from your wallet. " +
                    "You will be asked to approve it before it's sent to the network.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

private fun isValidAddress(address: String): Boolean = address.length > 10 && (address.startsWith("EQ") || address.startsWith("UQ"))

private fun isValidAmount(amount: String): Boolean {
    return runCatching {
        val value = amount.toDoubleOrNull() ?: return false
        value > 0
    }.getOrDefault(false)
}

private fun isAmountTooLarge(amount: String, balance: String?): Boolean {
    return runCatching {
        val amountValue = amount.toDoubleOrNull() ?: return false
        val balanceValue = balance?.toDoubleOrNull() ?: return true
        amountValue > balanceValue
    }.getOrDefault(true)
}
