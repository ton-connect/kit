package io.ton.walletkit.demo.presentation.ui.sections

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import io.ton.walletkit.demo.presentation.ui.components.EmptyNFTState
import io.ton.walletkit.demo.presentation.ui.components.NFTCard
import io.ton.walletkit.demo.presentation.viewmodel.NFTsListViewModel
import io.ton.walletkit.domain.model.TONNFTItem

/**
 * Section displaying NFTs owned by the wallet.
 */
@Composable
fun NFTsSection(
    viewModel: NFTsListViewModel,
    onNFTClick: (TONNFTItem) -> Unit,
    modifier: Modifier = Modifier,
) {
    val state by viewModel.state.collectAsState()
    val nfts by viewModel.nfts.collectAsState()
    val isLoadingMore by viewModel.isLoadingMore.collectAsState()

    // Auto-load NFTs when section is first displayed or when viewModel changes (wallet switch)
    LaunchedEffect(viewModel) {
        viewModel.loadNFTs()
    }

    Box(modifier = modifier.fillMaxWidth()) {
        when (state) {
            is NFTsListViewModel.NFTState.Initial,
            is NFTsListViewModel.NFTState.Loading,
            -> {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    CircularProgressIndicator()
                }
            }

            is NFTsListViewModel.NFTState.Empty -> {
                EmptyNFTState()
            }

            is NFTsListViewModel.NFTState.Success -> {
                Column {
                    // Horizontal scrolling row of NFTs
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        items(nfts, key = { it.address }) { nft ->
                            NFTCard(
                                nft = nft,
                                onClick = onNFTClick,
                                modifier = Modifier.width(160.dp), // Fixed width for horizontal scroll
                            )
                        }

                        // Load More button at the end
                        if (viewModel.canLoadMore) {
                            item {
                                Box(
                                    modifier = Modifier
                                        .width(120.dp)
                                        .height(200.dp)
                                        .padding(vertical = 8.dp),
                                    contentAlignment = Alignment.Center,
                                ) {
                                    Button(
                                        onClick = { viewModel.loadMoreNFTs() },
                                        enabled = !isLoadingMore,
                                    ) {
                                        if (isLoadingMore) {
                                            CircularProgressIndicator()
                                        } else {
                                            Text("Load\nMore")
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            is NFTsListViewModel.NFTState.Error -> {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp),
                    ) {
                        Text(
                            text = "Error loading NFTs: ${(state as NFTsListViewModel.NFTState.Error).message}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.error,
                        )
                        Button(
                            onClick = { viewModel.refresh() },
                        ) {
                            Text("Retry")
                        }
                    }
                }
            }
        }
    }
}
