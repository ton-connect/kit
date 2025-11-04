package io.ton.walletkit.demo.presentation.model

import io.ton.walletkit.demo.domain.model.WalletInterfaceType
import io.ton.walletkit.model.TONNetwork
import io.ton.walletkit.model.Transaction

data class WalletSummary(
    val address: String,
    val name: String,
    val network: TONNetwork,
    val version: String,
    val publicKey: String?,
    val balanceNano: String?,
    val balance: String?,
    val transactions: List<Transaction>?,
    val lastUpdated: Long?,
    val connectedSessions: List<SessionSummary> = emptyList(), // Sessions connected to this wallet
    val createdAt: Long? = null, // Unix timestamp in milliseconds when wallet was created/imported
    val interfaceType: WalletInterfaceType = WalletInterfaceType.MNEMONIC, // Wallet interface type
)
