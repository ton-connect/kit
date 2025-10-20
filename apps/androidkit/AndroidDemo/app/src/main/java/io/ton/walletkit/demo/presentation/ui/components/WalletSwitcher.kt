package io.ton.walletkit.demo.presentation.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.SwapHoriz
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import io.ton.walletkit.demo.R
import io.ton.walletkit.demo.presentation.model.WalletSummary
import io.ton.walletkit.demo.presentation.ui.preview.PreviewData

@Composable
fun WalletSwitcher(
    wallets: List<WalletSummary>,
    activeWalletAddress: String?,
    isExpanded: Boolean,
    onToggle: () -> Unit,
    onSwitchWallet: (String) -> Unit,
    onRemoveWallet: (String) -> Unit,
    onRenameWallet: (String, String) -> Unit,
    modifier: Modifier = Modifier,
) {
    var editingWalletAddress by rememberSaveable { mutableStateOf<String?>(null) }
    var editingName by rememberSaveable { mutableStateOf("") }
    var walletToDelete by remember { mutableStateOf<WalletSummary?>(null) }

    val activeWallet = wallets.firstOrNull { it.address == activeWalletAddress }

    fun startEdit(wallet: WalletSummary) {
        editingWalletAddress = wallet.address
        editingName = wallet.name
    }

    fun saveEdit() {
        editingWalletAddress?.let { address ->
            if (editingName.isNotBlank()) {
                onRenameWallet(address, editingName.trim())
            }
            editingWalletAddress = null
            editingName = ""
        }
    }

    fun cancelEdit() {
        editingWalletAddress = null
        editingName = ""
    }

    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface,
        ),
    ) {
        Column {
            // Active Wallet Header
            Row(
                modifier = Modifier
                    .fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f),
                ) {
                    Icon(
                        imageVector = Icons.Default.AccountBalanceWallet,
                        contentDescription = null,
                        modifier = Modifier.size(ACTIVE_WALLET_ICON_SIZE),
                        tint = MaterialTheme.colorScheme.primary,
                    )
                    Spacer(modifier = Modifier.width(ACTIVE_WALLET_ICON_SPACING))
                    Column {
                        Text(
                            text = activeWallet?.name ?: stringResource(R.string.wallet_switcher_no_wallet),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                        )
                        Text(
                            text = activeWallet?.let { formatAddress(it.address) }
                                ?: stringResource(R.string.wallet_switcher_select_wallet),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }

                if (wallets.size > 1) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = pluralStringResource(
                                R.plurals.wallet_switcher_wallet_count,
                                wallets.size,
                                wallets.size,
                            ),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(end = WALLET_COUNT_PADDING_END),
                        )
                        IconButton(onClick = onToggle) {
                            Icon(
                                imageVector = Icons.Default.ArrowDropDown,
                                contentDescription = if (isExpanded) {
                                    stringResource(R.string.wallet_switcher_collapse)
                                } else {
                                    stringResource(R.string.wallet_switcher_expand)
                                },
                                modifier = Modifier.rotate(if (isExpanded) 180f else 0f),
                            )
                        }
                    }
                }
            }

            // Wallet List (when expanded)
            AnimatedVisibility(
                visible = isExpanded,
                enter = fadeIn() + expandVertically(),
                exit = fadeOut() + shrinkVertically(),
            ) {
                Column(
                    modifier = Modifier.padding(horizontal = WALLET_LIST_HORIZONTAL_PADDING, vertical = WALLET_LIST_VERTICAL_PADDING),
                    verticalArrangement = Arrangement.spacedBy(WALLET_LIST_ITEM_SPACING),
                ) {
                    wallets.forEach { wallet ->
                        val isActive = wallet.address == activeWalletAddress
                        val isEditing = editingWalletAddress == wallet.address

                        OutlinedCard(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.outlinedCardColors(
                                containerColor = if (isActive) {
                                    MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f)
                                } else {
                                    MaterialTheme.colorScheme.surface
                                },
                            ),
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(WALLET_CARD_INNER_PADDING),
                            ) {
                                if (isEditing) {
                                    // Edit Mode
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                    ) {
                                        OutlinedTextField(
                                            value = editingName,
                                            onValueChange = { editingName = it },
                                            label = { Text(stringResource(R.string.wallet_switcher_wallet_name_label)) },
                                            singleLine = true,
                                            modifier = Modifier.weight(1f),
                                        )
                                        IconButton(onClick = { saveEdit() }) {
                                            Icon(
                                                imageVector = Icons.Default.Check,
                                                contentDescription = stringResource(R.string.action_save),
                                                tint = MaterialTheme.colorScheme.primary,
                                            )
                                        }
                                        IconButton(onClick = { cancelEdit() }) {
                                            Icon(
                                                imageVector = Icons.Default.Close,
                                                contentDescription = stringResource(R.string.action_cancel),
                                            )
                                        }
                                    }
                                } else {
                                    // View Mode
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically,
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Text(
                                                    text = wallet.name,
                                                    style = MaterialTheme.typography.titleSmall,
                                                    fontWeight = FontWeight.Medium,
                                                )
                                                if (isActive) {
                                                    Spacer(modifier = Modifier.width(ACTIVE_BADGE_SPACING))
                                                    Text(
                                                        text = stringResource(R.string.wallet_switcher_active_badge),
                                                        style = MaterialTheme.typography.labelSmall,
                                                        color = MaterialTheme.colorScheme.primary,
                                                        fontWeight = FontWeight.Bold,
                                                    )
                                                }
                                            }
                                            Spacer(modifier = Modifier.height(WALLET_ADDRESS_SPACING))
                                            Text(
                                                text = formatAddress(wallet.address),
                                                style = MaterialTheme.typography.bodySmall,
                                                fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                            )
                                            wallet.balance?.let { balance ->
                                                Text(
                                                    text = stringResource(R.string.wallet_switcher_balance_format, balance),
                                                    style = MaterialTheme.typography.bodyMedium,
                                                    color = MaterialTheme.colorScheme.onSurface,
                                                    fontWeight = FontWeight.Medium,
                                                )
                                            }
                                        }

                                        Row {
                                            if (!isActive) {
                                                IconButton(onClick = { onSwitchWallet(wallet.address) }) {
                                                    Icon(
                                                        imageVector = Icons.Default.SwapHoriz,
                                                        contentDescription = stringResource(R.string.action_switch),
                                                        tint = MaterialTheme.colorScheme.primary,
                                                    )
                                                }
                                            }
                                            IconButton(onClick = { startEdit(wallet) }) {
                                                Icon(
                                                    imageVector = Icons.Default.Edit,
                                                    contentDescription = stringResource(R.string.action_rename),
                                                )
                                            }
                                            IconButton(onClick = { walletToDelete = wallet }) {
                                                Icon(
                                                    imageVector = Icons.Default.Delete,
                                                    contentDescription = stringResource(R.string.action_remove),
                                                    tint = MaterialTheme.colorScheme.error,
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Delete Confirmation Dialog
    walletToDelete?.let { wallet ->
        AlertDialog(
            onDismissRequest = { walletToDelete = null },
            title = { Text(stringResource(R.string.wallet_switcher_remove_title)) },
            text = {
                Column {
                    Text(stringResource(R.string.wallet_switcher_remove_message))
                    Spacer(modifier = Modifier.height(DIALOG_SPACING))
                    Text(
                        text = wallet.name,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        text = formatAddress(wallet.address),
                        style = MaterialTheme.typography.bodySmall,
                        fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace,
                    )
                    if (wallet.address == activeWalletAddress && wallets.size > 1) {
                        Spacer(modifier = Modifier.height(DIALOG_SPACING))
                        Text(
                            text = stringResource(R.string.wallet_switcher_remove_warning),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.error,
                        )
                    }
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        onRemoveWallet(wallet.address)
                        walletToDelete = null
                    },
                ) {
                    Text(stringResource(R.string.action_remove), color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(onClick = { walletToDelete = null }) {
                    Text(stringResource(R.string.action_cancel))
                }
            },
        )
    }
}

private fun formatAddress(address: String): String = if (address.length > FORMAT_ADDRESS_THRESHOLD) {
    "${address.take(6)}...${address.takeLast(4)}"
} else {
    address
}

private val ACTIVE_WALLET_ICON_SIZE = 40.dp
private val ACTIVE_WALLET_ICON_SPACING = 12.dp
private val WALLET_COUNT_PADDING_END = 8.dp
private val WALLET_LIST_HORIZONTAL_PADDING = 16.dp
private val WALLET_LIST_VERTICAL_PADDING = 8.dp
private val WALLET_LIST_ITEM_SPACING = 8.dp
private val WALLET_CARD_INNER_PADDING = 12.dp
private val ACTIVE_BADGE_SPACING = 8.dp
private val WALLET_ADDRESS_SPACING = 4.dp
private val DIALOG_SPACING = 8.dp
private const val FORMAT_ADDRESS_THRESHOLD = 12

@Preview(showBackground = true)
@Composable
private fun WalletSwitcherPreview() {
    val wallets = listOf(
        PreviewData.wallet,
        PreviewData.wallet.copy(
            address = "EQD9876543210",
            name = "Wallet 2",
            balance = "123.45",
        ),
        PreviewData.wallet.copy(
            address = "EQD1111111111",
            name = "Wallet 3",
            balance = "0.50",
        ),
    )

    WalletSwitcher(
        wallets = wallets,
        activeWalletAddress = wallets.first().address,
        isExpanded = true,
        onToggle = {},
        onSwitchWallet = {},
        onRemoveWallet = {},
        onRenameWallet = { _, _ -> },
    )
}
