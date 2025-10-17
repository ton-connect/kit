package io.ton.walletkit.demo.presentation.ui.sheet

import androidx.annotation.StringRes
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContentPaste
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import io.ton.walletkit.demo.R
import io.ton.walletkit.demo.domain.model.WalletInterfaceType
import io.ton.walletkit.domain.model.TONNetwork

@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun AddWalletSheet(
    onDismiss: () -> Unit,
    onImportWallet: (String, TONNetwork, List<String>, String, WalletInterfaceType) -> Unit,
    onGenerateWallet: (String, TONNetwork, String, WalletInterfaceType) -> Unit,
    walletCount: Int,
) {
    var selectedTab by remember { mutableStateOf(AddWalletTab.Import) }
    var walletName by rememberSaveable { mutableStateOf("Wallet ${walletCount + 1}") }
    var network by rememberSaveable { mutableStateOf(TONNetwork.MAINNET) }
    var walletVersion by rememberSaveable { mutableStateOf("v4r2") }
    var interfaceType by rememberSaveable { mutableStateOf(WalletInterfaceType.MNEMONIC) }
    val mnemonicWords = remember { mutableStateListOf(*Array(24) { "" }) }
    var pasteField by rememberSaveable { mutableStateOf("") }
    val clipboardManager = LocalClipboardManager.current

    // Function to parse pasted text into individual words
    fun parseSeedPhrase(text: String) {
        val words = text
            .trim()
            .lowercase()
            .split(Regex("\\s+")) // Split by any whitespace (space, tab, newline)
            .filter { it.isNotBlank() }
            .take(24) // Only take first 24 words

        // Clear existing words
        for (i in mnemonicWords.indices) {
            mnemonicWords[i] = ""
        }

        // Fill in the parsed words
        words.forEachIndexed { index, word ->
            if (index < 24) {
                mnemonicWords[index] = word
            }
        }

        // Clear paste field after parsing
        pasteField = ""
    }

    Column(
        modifier = Modifier
            .padding(20.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text(stringResource(R.string.add_wallet_title), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        SingleChoiceSegmentedButtonRow {
            AddWalletTab.entries.forEachIndexed { index, tab ->
                SegmentedButton(
                    selected = selectedTab == tab,
                    onClick = { selectedTab = tab },
                    shape = SegmentedButtonDefaults.itemShape(index, AddWalletTab.entries.size),
                    label = { Text(stringResource(tab.labelRes)) },
                )
            }
        }

        TextField(
            value = walletName,
            onValueChange = { walletName = it },
            label = { Text(stringResource(R.string.label_wallet_name)) },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )

        Text(stringResource(R.string.label_network), style = MaterialTheme.typography.titleSmall)
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            TONNetwork.entries.forEach { option ->
                FilterChip(
                    selected = network == option,
                    onClick = { network = option },
                    label = {
                        Text(
                            when (option) {
                                TONNetwork.MAINNET -> stringResource(R.string.network_mainnet)
                                TONNetwork.TESTNET -> stringResource(R.string.network_testnet)
                            },
                        )
                    },
                )
            }
        }

        Text(stringResource(R.string.label_wallet_version), style = MaterialTheme.typography.titleSmall)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("v4r2", "v5r1", "v3r2").forEach { version ->
                FilterChip(
                    selected = walletVersion == version,
                    onClick = { walletVersion = version },
                    label = {
                        Column {
                            Text(version, fontWeight = FontWeight.Bold)
                            if (version == "v4r2") {
                                Text(stringResource(R.string.add_wallet_version_default), style = MaterialTheme.typography.labelSmall)
                            }
                        }
                    },
                )
            }
        }

        Text(stringResource(R.string.label_wallet_interface_type), style = MaterialTheme.typography.titleSmall)
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            WalletInterfaceType.entries.forEach { type ->
                FilterChip(
                    selected = interfaceType == type,
                    onClick = { interfaceType = type },
                    label = {
                        Column {
                            Text(
                                when (type) {
                                    WalletInterfaceType.MNEMONIC -> stringResource(R.string.interface_type_mnemonic)
                                    WalletInterfaceType.SIGNER -> stringResource(R.string.interface_type_signer)
                                },
                                fontWeight = FontWeight.Bold,
                            )
                            Text(
                                when (type) {
                                    WalletInterfaceType.MNEMONIC -> stringResource(R.string.interface_type_mnemonic_desc)
                                    WalletInterfaceType.SIGNER -> stringResource(R.string.interface_type_signer_desc)
                                },
                                style = MaterialTheme.typography.labelSmall,
                            )
                        }
                    },
                )
            }
        }

        when (selectedTab) {
            AddWalletTab.Import -> {
                Text(
                    stringResource(R.string.add_wallet_recovery_title, MNEMONIC_WORD_COUNT),
                    style = MaterialTheme.typography.titleSmall,
                )

                // Paste field for quick input
                OutlinedTextField(
                    value = pasteField,
                    onValueChange = {
                        pasteField = it
                        // Auto-parse when text is pasted (contains multiple words)
                        if (it.trim().split(Regex("\\s+")).size > 1) {
                            parseSeedPhrase(it)
                        }
                    },
                    label = { Text(stringResource(R.string.add_wallet_paste_label)) },
                    placeholder = { Text(stringResource(R.string.add_wallet_recovery_placeholder)) },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2,
                    maxLines = 3,
                    trailingIcon = {
                        IconButton(
                            onClick = {
                                clipboardManager.getText()?.text?.let { clipboardText ->
                                    parseSeedPhrase(clipboardText)
                                }
                            },
                        ) {
                            Icon(
                                imageVector = Icons.Default.ContentPaste,
                                contentDescription = stringResource(R.string.add_wallet_clipboard_content_description),
                            )
                        }
                    },
                    supportingText = {
                        Text(
                            stringResource(R.string.add_wallet_paste_supporting_text),
                            style = MaterialTheme.typography.bodySmall,
                        )
                    },
                )

                Spacer(modifier = Modifier.height(8.dp))

                LazyVerticalGrid(
                    columns = GridCells.Fixed(3),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    userScrollEnabled = false,
                    modifier = Modifier.heightIn(max = 600.dp),
                ) {
                    itemsIndexed(mnemonicWords) { index, word ->
                        TextField(
                            value = word,
                            onValueChange = { mnemonicWords[index] = it.lowercase().trim() },
                            singleLine = true,
                            label = { Text("${index + 1}") },
                            modifier = Modifier.fillMaxWidth(),
                            textStyle = MaterialTheme.typography.bodySmall,
                        )
                    }
                }
                Spacer(modifier = Modifier.height(12.dp))
                Button(
                    onClick = { onImportWallet(walletName, network, mnemonicWords.toList(), walletVersion, interfaceType) },
                    modifier = Modifier.fillMaxWidth(),
                ) { Text(stringResource(R.string.action_import_wallet)) }
            }

            AddWalletTab.Generate -> {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        stringResource(R.string.add_wallet_generate_description),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Button(
                        onClick = { onGenerateWallet(walletName, network, walletVersion, interfaceType) },
                        modifier = Modifier.fillMaxWidth(),
                    ) { Text(stringResource(R.string.action_generate_wallet)) }
                }
            }
        }

        TextButton(onClick = onDismiss) { Text(stringResource(R.string.action_cancel)) }
    }
}

private enum class AddWalletTab(@StringRes val labelRes: Int) {
    Import(R.string.add_wallet_tab_import),
    Generate(R.string.add_wallet_tab_generate),
}

private const val MNEMONIC_WORD_COUNT = 24

@Preview(showBackground = true)
@Composable
private fun AddWalletSheetPreview() {
    AddWalletSheet(
        onDismiss = {},
        onImportWallet = { _, _, _, _, _ -> },
        onGenerateWallet = { _, _, _, _ -> },
        walletCount = 1,
    )
}
