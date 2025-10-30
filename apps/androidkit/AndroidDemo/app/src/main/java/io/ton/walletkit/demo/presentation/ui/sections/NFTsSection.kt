package io.ton.walletkit.demo.presentation.ui.sections

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
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

/**
 * Section displaying NFTs owned by the wallet.
 */
@Composable
fun NFTsSection(
    viewModel: NFTsListViewModel,
    modifier: Modifier = Modifier,
) {
    val state by viewModel.state.collectAsState()
    val nfts by viewModel.nfts.collectAsState()
    val isLoadingMore by viewModel.isLoadingMore.collectAsState()

    // Auto-load NFTs when section is first displayed
    LaunchedEffect(Unit) {
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
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    contentPadding = PaddingValues(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.height(400.dp), // Fixed height to work inside scrollable container
                ) {
                    items(nfts, key = { it.address }) { nft ->
                        NFTCard(
                            nft = nft,
                            onClick = {
                                // TODO: Navigate to NFT details
                            },
                        )
                    }

                    // Load More button
                    if (viewModel.canLoadMore) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                contentAlignment = Alignment.Center,
                            ) {
                                Button(
                                    onClick = { viewModel.loadMoreNFTs() },
                                    enabled = !isLoadingMore,
                                ) {
                                    if (isLoadingMore) {
                                        CircularProgressIndicator(
                                            modifier = Modifier.padding(end = 8.dp),
                                        )
                                    }
                                    Text("Load More")
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
                    Text(
                        text = "Error loading NFTs: ${(state as NFTsListViewModel.NFTState.Error).message}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.error,
                    )
                }
            }
        }
    }
}
