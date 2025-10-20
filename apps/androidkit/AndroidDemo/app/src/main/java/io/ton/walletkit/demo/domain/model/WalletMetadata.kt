package io.ton.walletkit.demo.domain.model

import io.ton.walletkit.domain.model.TONNetwork

data class WalletMetadata(
    val name: String,
    val network: TONNetwork,
    val version: String,
)
