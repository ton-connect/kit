package io.ton.walletkit.demo.presentation.ui.components

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import io.ton.walletkit.domain.model.TONNetwork

@Composable
fun NetworkBadge(network: TONNetwork) {
    val color = when (network) {
        TONNetwork.MAINNET -> MAINNET_COLOR
        TONNetwork.TESTNET -> TESTNET_COLOR
    }
    Surface(shape = MaterialTheme.shapes.medium, color = color.copy(alpha = 0.12f)) {
        Text(
            text = when (network) {
                TONNetwork.MAINNET -> MAINNET_LABEL
                TONNetwork.TESTNET -> TESTNET_LABEL
            },
            modifier = Modifier.padding(horizontal = BADGE_HORIZONTAL_PADDING, vertical = BADGE_VERTICAL_PADDING),
            color = color,
            style = MaterialTheme.typography.labelMedium,
        )
    }
}

private val BADGE_HORIZONTAL_PADDING = 10.dp
private val BADGE_VERTICAL_PADDING = 4.dp
private val MAINNET_COLOR = Color(0xFF2E7D32)
private val TESTNET_COLOR = Color(0xFFF57C00)
private const val MAINNET_LABEL = "Mainnet"
private const val TESTNET_LABEL = "Testnet"

@Preview
@Composable
private fun NetworkBadgePreview() {
    NetworkBadge(network = TONNetwork.MAINNET)
}
