package io.ton.walletkit.demo.presentation.ui.sections

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import io.ton.walletkit.demo.presentation.model.JettonSummary
import io.ton.walletkit.demo.presentation.ui.components.JettonListItem

/**
 * Section displaying jettons owned by the wallet.
 *
 * Mirrors iOS WalletJettonsListView for cross-platform consistency.
 */
@Composable
fun JettonsSection(
    jettons: List<JettonSummary>,
    isLoading: Boolean,
    error: String?,
    canLoadMore: Boolean,
    onJettonClick: (JettonSummary) -> Unit,
    onLoadMore: () -> Unit,
    onRefresh: () -> Unit,
    modifier: Modifier = Modifier,
) {
    // Auto-load jettons when section is first displayed
    LaunchedEffect(Unit) {
        onRefresh()
    }

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        // Header
        Text(
            text = "Jettons",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.padding(horizontal = 16.dp),
        )

        when {
            // Loading state
            isLoading && jettons.isEmpty() -> {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    CircularProgressIndicator()
                }
            }

            // Error state
            error != null && jettons.isEmpty() -> {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Text(
                            text = "Failed to load jettons",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.error,
                        )
                        Button(onClick = onRefresh) {
                            Text("Retry")
                        }
                    }
                }
            }

            // Empty state
            jettons.isEmpty() -> {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Text(
                            text = "No Jettons found",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Button(onClick = onRefresh) {
                            Text("Try Again")
                        }
                    }
                }
            }

            // Success state - display jettons
            else -> {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    // Display each jetton
                    jettons.forEach { jetton ->
                        JettonListItem(
                            jetton = jetton,
                            onClick = onJettonClick,
                            modifier = Modifier.padding(horizontal = 16.dp),
                        )
                    }

                    // Load More button
                    if (canLoadMore) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            contentAlignment = Alignment.Center,
                        ) {
                            Button(
                                onClick = onLoadMore,
                                enabled = !isLoading,
                            ) {
                                if (isLoading) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.padding(horizontal = 8.dp),
                                    )
                                } else {
                                    Text("Load more")
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
