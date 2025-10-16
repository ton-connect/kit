package io.ton.walletkit.demo.domain.model

data class PendingWalletRecord(
    val metadata: WalletMetadata,
    val mnemonic: List<String>?,
)
