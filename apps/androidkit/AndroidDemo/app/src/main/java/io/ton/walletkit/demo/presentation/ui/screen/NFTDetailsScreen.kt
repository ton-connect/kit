package io.ton.walletkit.demo.presentation.ui.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Snackbar
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil3.compose.SubcomposeAsyncImage
import io.ton.walletkit.demo.presentation.model.NFTDetails
import io.ton.walletkit.demo.presentation.ui.dialog.WalletAddressInputDialog
import io.ton.walletkit.demo.presentation.viewmodel.NFTDetailsViewModel
import io.ton.walletkit.presentation.TONWalletKit

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NFTDetailsScreen(
    walletAddress: String,
    walletKit: TONWalletKit,
    nftDetails: NFTDetails,
    onClose: () -> Unit,
    onTransferSuccess: () -> Unit = {},
) {
    // Get the wallet instance from walletKit asynchronously
    var wallet by remember { mutableStateOf<io.ton.walletkit.presentation.TONWallet?>(null) }
    var isLoadingWallet by remember { mutableStateOf(true) }

    LaunchedEffect(walletAddress) {
        isLoadingWallet = true
        wallet = walletKit.getWallets().firstOrNull { it.address == walletAddress }
        isLoadingWallet = false
    }

    // Show loading state while fetching wallet
    if (isLoadingWallet) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center,
        ) {
            CircularProgressIndicator()
        }
        return
    }

    // Show error if wallet not found
    if (wallet == null) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center,
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                Text("Wallet not found", style = MaterialTheme.typography.titleMedium)
                Button(onClick = onClose) {
                    Text("Close")
                }
            }
        }
        return
    }

    val viewModel: NFTDetailsViewModel = viewModel(
        key = walletAddress + nftDetails.contractAddress,
        factory = NFTDetailsViewModel.factory(wallet!!, nftDetails),
    )

    val details by viewModel.nftDetails.collectAsState()
    val isTransferring by viewModel.isTransferring.collectAsState()
    val transferResult by viewModel.transferResult.collectAsState()

    var showAddressDialog by remember { mutableStateOf(false) }
    var showSuccessDialog by remember { mutableStateOf(false) }
    var successTxHash by remember { mutableStateOf("") }

    // Handle transfer result
    LaunchedEffect(transferResult) {
        when (val result = transferResult) {
            is NFTDetailsViewModel.TransferResult.Success -> {
                successTxHash = result.txHash
                showSuccessDialog = true
                viewModel.clearTransferResult()
            }
            is NFTDetailsViewModel.TransferResult.Error -> {
                // Error is shown in Snackbar below
            }
            null -> { /* No result yet */ }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("NFT Details") },
                navigationIcon = {
                    IconButton(onClick = onClose) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                },
            )
        },
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(bottom = 80.dp), // Space for bottom buttons
            ) {
                // NFT Image
                SubcomposeAsyncImage(
                    model = details.imageUrl,
                    contentDescription = details.name,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(300.dp),
                    contentScale = ContentScale.Crop,
                    loading = {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center,
                        ) {
                            CircularProgressIndicator()
                        }
                    },
                    error = {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center,
                        ) {
                            Text(
                                "Failed to load image",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.error,
                            )
                        }
                    },
                )

                // NFT Information
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    // Name
                    Text(
                        text = details.name,
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold,
                    )

                    // Description
                    details.description?.let { description ->
                        if (description.isNotBlank()) {
                            InfoSection(title = "Description", content = description)
                        }
                    }

                    // Collection
                    details.collectionName?.let { collectionName ->
                        if (collectionName.isNotBlank()) {
                            InfoSection(title = "Collection", content = collectionName)
                        }
                    }

                    // Index
                    details.index?.let { index ->
                        InfoSection(title = "Index", content = "#$index")
                    }

                    // Status
                    details.status?.let { status ->
                        if (status.isNotBlank()) {
                            InfoSection(title = "Status", content = status)
                        }
                    }

                    // Contract Address
                    InfoSection(
                        title = "Contract Address",
                        content = details.contractAddress,
                        monospace = true,
                    )

                    // Owner Address
                    details.ownerAddress?.let { ownerAddress ->
                        InfoSection(
                            title = "Owner Address",
                            content = ownerAddress,
                            monospace = true,
                        )
                    }

                    // Transfer eligibility message
                    if (!details.canTransfer) {
                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.errorContainer,
                            ),
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Text(
                                text = "This NFT cannot be transferred (on sale or missing owner information)",
                                modifier = Modifier.padding(16.dp),
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onErrorContainer,
                            )
                        }
                    }
                }
            }

            // Bottom Action Buttons
            Surface(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth(),
                shadowElevation = 8.dp,
                tonalElevation = 3.dp,
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    OutlinedButton(
                        onClick = onClose,
                        modifier = Modifier.weight(1f),
                        enabled = !isTransferring,
                    ) {
                        Text("Close")
                    }

                    Button(
                        onClick = { showAddressDialog = true },
                        modifier = Modifier.weight(1f),
                        enabled = details.canTransfer && !isTransferring,
                    ) {
                        if (isTransferring) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                color = MaterialTheme.colorScheme.onPrimary,
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                        }
                        Text(if (isTransferring) "Transferring..." else "Transfer")
                    }
                }
            }

            // Loading overlay
            if (isTransferring) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center,
                ) {
                    Surface(
                        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.9f),
                        modifier = Modifier.fillMaxSize(),
                    ) {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center,
                        ) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(16.dp),
                            ) {
                                CircularProgressIndicator()
                                Text(
                                    text = "Transferring NFT...",
                                    style = MaterialTheme.typography.titleMedium,
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // Address Input Dialog
    if (showAddressDialog) {
        WalletAddressInputDialog(
            onDismiss = { showAddressDialog = false },
            onConfirm = { address ->
                showAddressDialog = false
                viewModel.transfer(address)
            },
            isValidAddress = viewModel::validateAddress,
        )
    }

    // Success Dialog
    if (showSuccessDialog) {
        AlertDialog(
            onDismissRequest = {
                showSuccessDialog = false
                onTransferSuccess() // Refresh NFT list
                onClose() // Close the details screen after success
            },
            icon = {
                Icon(
                    imageVector = Icons.Default.Close, // Replace with success icon if available
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                )
            },
            title = { Text("Transfer Successful") },
            text = {
                Column {
                    Text("Your NFT has been transferred successfully!")
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Transaction Hash:",
                        style = MaterialTheme.typography.labelSmall,
                    )
                    Text(
                        text = successTxHash,
                        style = MaterialTheme.typography.bodySmall,
                        fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace,
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        showSuccessDialog = false
                        onTransferSuccess() // Refresh NFT list
                        onClose()
                    },
                ) {
                    Text("OK")
                }
            },
        )
    }

    // Error Snackbar
    transferResult?.let { result ->
        if (result is NFTDetailsViewModel.TransferResult.Error) {
            Snackbar(
                modifier = Modifier.padding(16.dp),
                action = {
                    TextButton(onClick = { viewModel.clearTransferResult() }) {
                        Text("Dismiss")
                    }
                },
            ) {
                Text(result.message)
            }
        }
    }
}

@Composable
private fun InfoSection(
    title: String,
    content: String,
    monospace: Boolean = false,
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Text(
            text = content,
            style = MaterialTheme.typography.bodyLarge,
            fontFamily = if (monospace) {
                androidx.compose.ui.text.font.FontFamily.Monospace
            } else {
                androidx.compose.ui.text.font.FontFamily.Default
            },
        )
    }
}
