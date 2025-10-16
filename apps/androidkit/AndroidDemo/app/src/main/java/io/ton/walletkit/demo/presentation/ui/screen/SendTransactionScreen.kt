package io.ton.walletkit.demo.presentation.ui.screen

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
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import io.ton.walletkit.demo.presentation.model.WalletSummary
import io.ton.walletkit.demo.presentation.ui.preview.PreviewData

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
                        text = SEND_SCREEN_TITLE,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.SemiBold,
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = BACK_CONTENT_DESCRIPTION)
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
                .padding(horizontal = SEND_SCREEN_HORIZONTAL_PADDING, vertical = SEND_SCREEN_VERTICAL_PADDING),
            verticalArrangement = Arrangement.spacedBy(SEND_SCREEN_SECTION_SPACING),
        ) {
            // Wallet Info
            Column(verticalArrangement = Arrangement.spacedBy(SEND_SCREEN_SECTION_GAP)) {
                Text(
                    WALLET_FROM_LABEL,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(
                    wallet.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    formatBalanceLabel(wallet.balance),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }

            // Recipient Address
            OutlinedTextField(
                value = recipient,
                onValueChange = { recipient = it },
                label = { Text(RECIPIENT_ADDRESS_LABEL) },
                placeholder = { Text(RECIPIENT_ADDRESS_PLACEHOLDER) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                isError = recipient.isNotEmpty() && !isValidAddress(recipient),
                supportingText = {
                    if (recipient.isNotEmpty() && !isValidAddress(recipient)) {
                        Text(INVALID_ADDRESS_MESSAGE)
                    }
                },
            )

            // Amount
            OutlinedTextField(
                value = amount,
                onValueChange = { amount = it },
                label = { Text(AMOUNT_LABEL) },
                placeholder = { Text(AMOUNT_PLACEHOLDER) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                isError = amount.isNotEmpty() && !isValidAmount(amount),
                supportingText = {
                    if (amount.isNotEmpty() && !isValidAmount(amount)) {
                        Text(INVALID_AMOUNT_MESSAGE)
                    } else if (amount.isNotEmpty() && isAmountTooLarge(amount, wallet.balance)) {
                        Text(INSUFFICIENT_BALANCE_MESSAGE)
                    }
                },
            )

            // Comment (Optional)
            OutlinedTextField(
                value = comment,
                onValueChange = { comment = it },
                label = { Text(COMMENT_LABEL) },
                placeholder = { Text(COMMENT_PLACEHOLDER) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = false,
                maxLines = 3,
                supportingText = {
                    Text(COMMENT_HELP_TEXT)
                },
            )

            Spacer(modifier = Modifier.height(SEND_BUTTON_TOP_SPACING))

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
                Text(if (isLoading) SENDING_LABEL else SEND_TRANSACTION_LABEL)
            }

            // Info
            Text(
                SEND_INFO_MESSAGE,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

private fun isValidAddress(address: String): Boolean = address.length > MIN_ADDRESS_LENGTH &&
    (address.startsWith(ADDRESS_MAIN_PREFIX) || address.startsWith(ADDRESS_TEST_PREFIX))

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

private fun formatBalanceLabel(balance: String?): String {
    val displayBalance = balance ?: DEFAULT_BALANCE_FALLBACK
    return "$BALANCE_PREFIX$displayBalance$TON_SUFFIX"
}

private val SEND_SCREEN_HORIZONTAL_PADDING = 20.dp
private val SEND_SCREEN_VERTICAL_PADDING = 16.dp
private val SEND_SCREEN_SECTION_SPACING = 24.dp
private val SEND_SCREEN_SECTION_GAP = 8.dp
private val SEND_BUTTON_TOP_SPACING = 16.dp
private const val SEND_SCREEN_TITLE = "Send TON"
private const val WALLET_FROM_LABEL = "From"
private const val BALANCE_PREFIX = "Balance: "
private const val TON_SUFFIX = " TON"
private const val DEFAULT_BALANCE_FALLBACK = "0"
private const val RECIPIENT_ADDRESS_LABEL = "Recipient Address"
private const val RECIPIENT_ADDRESS_PLACEHOLDER = "EQ... or UQ..."
private const val INVALID_ADDRESS_MESSAGE = "Invalid TON address"
private const val AMOUNT_LABEL = "Amount (TON)"
private const val AMOUNT_PLACEHOLDER = "0.00"
private const val INVALID_AMOUNT_MESSAGE = "Invalid amount"
private const val INSUFFICIENT_BALANCE_MESSAGE = "Insufficient balance"
private const val COMMENT_LABEL = "Comment (Optional)"
private const val COMMENT_PLACEHOLDER = "Add a message..."
private const val COMMENT_HELP_TEXT = "This message will be visible on the blockchain"
private const val SENDING_LABEL = "Sending..."
private const val SEND_TRANSACTION_LABEL = "Send Transaction"
private const val SEND_INFO_MESSAGE = "This will create and send a transaction from your wallet. You will be asked to approve it before it's sent to the network."
private const val BACK_CONTENT_DESCRIPTION = "Back"
private const val MIN_ADDRESS_LENGTH = 10
private const val ADDRESS_MAIN_PREFIX = "EQ"
private const val ADDRESS_TEST_PREFIX = "UQ"

@Preview(showBackground = true)
@Composable
private fun SendTransactionScreenPreview() {
    SendTransactionScreen(
        wallet = PreviewData.wallet.copy(balance = "12.50"),
        onBack = {},
        onSend = { _, _, _ -> },
        error = null,
        isLoading = false,
    )
}
