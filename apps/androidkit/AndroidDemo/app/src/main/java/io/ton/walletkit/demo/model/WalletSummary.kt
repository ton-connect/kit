package io.ton.walletkit.demo.model

import org.json.JSONArray

data class WalletSummary(
    val address: String,
    val name: String,
    val network: TonNetwork,
    val version: String,
    val publicKey: String?,
    val balanceNano: String?,
    val balance: String?,
    val transactions: JSONArray?,
    val lastUpdated: Long?,
    val connectedSessions: List<SessionSummary> = emptyList(), // Sessions connected to this wallet
)
