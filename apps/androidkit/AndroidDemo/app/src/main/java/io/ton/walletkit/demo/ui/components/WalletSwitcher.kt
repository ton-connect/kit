package io.ton.walletkit.demo.ui.components

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import io.ton.walletkit.demo.model.TonNetwork
import io.ton.walletkit.demo.model.WalletSummary
import io.ton.walletkit.demo.ui.preview.PreviewData

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
                        modifier = Modifier.size(40.dp),
                        tint = MaterialTheme.colorScheme.primary,
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = activeWallet?.name ?: "No Wallet",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                        )
                        Text(
                            text = activeWallet?.let { formatAddress(it.address) } ?: "Select a wallet",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }

                if (wallets.size > 1) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "${wallets.size} wallets",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(end = 8.dp),
                        )
                        IconButton(onClick = onToggle) {
                            Icon(
                                imageVector = Icons.Default.ArrowDropDown,
                                contentDescription = if (isExpanded) "Collapse" else "Expand",
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
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
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
                                    .padding(12.dp),
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
                                            label = { Text("Wallet name") },
                                            singleLine = true,
                                            modifier = Modifier.weight(1f),
                                        )
                                        IconButton(onClick = { saveEdit() }) {
                                            Icon(
                                                imageVector = Icons.Default.Check,
                                                contentDescription = "Save",
                                                tint = MaterialTheme.colorScheme.primary,
                                            )
                                        }
                                        IconButton(onClick = { cancelEdit() }) {
                                            Icon(
                                                imageVector = Icons.Default.Close,
                                                contentDescription = "Cancel",
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
                                                    Spacer(modifier = Modifier.width(8.dp))
                                                    Text(
                                                        text = "Active",
                                                        style = MaterialTheme.typography.labelSmall,
                                                        color = MaterialTheme.colorScheme.primary,
                                                        fontWeight = FontWeight.Bold,
                                                    )
                                                }
                                            }
                                            Spacer(modifier = Modifier.height(4.dp))
                                            Text(
                                                text = formatAddress(wallet.address),
                                                style = MaterialTheme.typography.bodySmall,
                                                fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                            )
                                            wallet.balance?.let { balance ->
                                                Text(
                                                    text = "$balance TON",
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
                                                        contentDescription = "Switch to this wallet",
                                                        tint = MaterialTheme.colorScheme.primary,
                                                    )
                                                }
                                            }
                                            IconButton(onClick = { startEdit(wallet) }) {
                                                Icon(
                                                    imageVector = Icons.Default.Edit,
                                                    contentDescription = "Rename wallet",
                                                )
                                            }
                                            IconButton(onClick = { walletToDelete = wallet }) {
                                                Icon(
                                                    imageVector = Icons.Default.Delete,
                                                    contentDescription = "Remove wallet",
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
            title = { Text("Remove Wallet?") },
            text = {
                Column {
                    Text("Are you sure you want to remove this wallet?")
                    Spacer(modifier = Modifier.height(8.dp))
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
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "This will switch to another wallet.",
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
                    Text("Remove", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(onClick = { walletToDelete = null }) {
                    Text("Cancel")
                }
            },
        )
    }
}

private fun formatAddress(address: String): String = if (address.length > 12) {
    "${address.take(6)}...${address.takeLast(4)}"
} else {
    address
}

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
