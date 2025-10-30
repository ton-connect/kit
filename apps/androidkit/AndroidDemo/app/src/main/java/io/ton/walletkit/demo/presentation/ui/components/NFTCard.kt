package io.ton.walletkit.demo.presentation.ui.components

import android.util.Log
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
import coil3.compose.AsyncImagePainter
import coil3.compose.rememberAsyncImagePainter
import io.ton.walletkit.demo.presentation.ui.preview.PreviewData
import io.ton.walletkit.domain.model.TONNFTItem
import kotlinx.serialization.json.jsonPrimitive

/**
 * Card component for displaying an NFT item in a grid.
 *
 * Extracts image URL from NFT metadata, preferring _image_medium from extra if available.
 */
@Composable
fun NFTCard(
    nft: TONNFTItem,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    // Get image URL, preferring _image_medium from extra if available (like demo wallet)
    // Use remember to avoid recomputing on every recomposition
    val imageUrl = remember(nft.address) {
        try {
            // Try to get _image_medium from extra first
            val mediumImage = nft.metadata?.extra?.get("_image_medium")?.jsonPrimitive?.content
            mediumImage ?: nft.metadata?.image
        } catch (e: Exception) {
            Log.e("NFTCard", "Error extracting image URL for ${nft.address}", e)
            nft.metadata?.image
        }
    }

    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = RoundedCornerShape(12.dp),
    ) {
        Column {
            // NFT Image - using AsyncImage directly as recommended for LazyGrid
            AsyncImage(
                model = imageUrl,
                contentDescription = nft.metadata?.name ?: "NFT",
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(1f)
                    .clip(RoundedCornerShape(topStart = 12.dp, topEnd = 12.dp)),
                contentScale = ContentScale.Crop,
            )

            // NFT Info
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp),
            ) {
                Text(
                    text = nft.metadata?.name ?: "Unnamed NFT",
                    style = MaterialTheme.typography.titleMedium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )

                nft.collection?.let { collection ->
                    Text(
                        text = collection.address.take(8) + "...",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                    )
                }
            }
        }
    }
}

/**
 * Empty state for when no NFTs are found.
 */
@Composable
fun EmptyNFTState(
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(32.dp),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = "🖼️",
                style = MaterialTheme.typography.displayLarge,
            )
            Text(
                text = "No NFTs found",
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(top = 16.dp),
            )
            Text(
                text = "This wallet doesn't own any NFTs yet",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 8.dp),
            )
        }
    }
}

@Preview(showBackground = true)
@Composable
private fun NFTCardPreview() {
    MaterialTheme {
        NFTCard(
            nft = PreviewData.nftItem,
            onClick = {},
        )
    }
}

@Preview(showBackground = true)
@Composable
private fun EmptyNFTStatePreview() {
    MaterialTheme {
        EmptyNFTState()
    }
}
