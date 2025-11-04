package io.ton.walletkit.model

/**
 * Represents an active TON Connect session between a wallet and a dApp.
 *
 * A session is established when a user connects their wallet to a decentralized application.
 * It persists across app restarts and allows the dApp to request transactions and signatures
 * without requiring the user to reconnect.
 *
 * @property sessionId Unique identifier for this session
 * @property dAppName Display name of the connected dApp
 * @property walletAddress The wallet address used for this session
 * @property dAppUrl Optional URL of the dApp's website
 * @property manifestUrl Optional URL to the dApp's TON Connect manifest
 * @property iconUrl Optional URL to the dApp's icon/logo
 * @property createdAtIso ISO 8601 timestamp when the session was created (nullable if unknown)
 * @property lastActivityIso ISO 8601 timestamp of the last activity on this session (nullable if unknown)
 */
data class WalletSession(
    val sessionId: String,
    val dAppName: String,
    val walletAddress: String,
    val dAppUrl: String?,
    val manifestUrl: String?,
    val iconUrl: String?,
    val createdAtIso: String?,
    val lastActivityIso: String?,
)
