package io.ton.walletkit.demo.presentation.model

data class SessionSummary(
    val sessionId: String,
    val dAppName: String,
    val walletAddress: String,
    val dAppUrl: String?,
    val manifestUrl: String?,
    val iconUrl: String?,
    val createdAt: Long?,
    val lastActivity: Long?,
)
