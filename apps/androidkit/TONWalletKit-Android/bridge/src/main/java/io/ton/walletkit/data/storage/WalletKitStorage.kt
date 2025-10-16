package io.ton.walletkit.data.storage

import io.ton.walletkit.data.model.PendingEvent
import io.ton.walletkit.data.model.StoredBridgeConfig
import io.ton.walletkit.data.model.StoredSessionData
import io.ton.walletkit.data.model.StoredUserPreferences
import io.ton.walletkit.data.model.StoredWalletRecord

/**
 * Internal storage interface for WalletKit data persistence.
 *
 * @suppress This is an internal interface. Partners should not implement or use this directly.
 */
internal interface WalletKitStorage {
    // Wallet management
    suspend fun saveWallet(accountId: String, record: StoredWalletRecord)

    suspend fun loadWallet(accountId: String): StoredWalletRecord?

    suspend fun loadAllWallets(): Map<String, StoredWalletRecord>

    suspend fun clear(accountId: String)

    // Session data (with private keys)
    suspend fun saveSessionData(sessionId: String, session: StoredSessionData)

    suspend fun loadSessionData(sessionId: String): StoredSessionData?

    suspend fun loadAllSessionData(): Map<String, StoredSessionData>

    suspend fun clearSessionData(sessionId: String)

    suspend fun updateSessionActivity(sessionId: String, timestamp: String)

    // Bridge configuration
    suspend fun saveBridgeConfig(config: StoredBridgeConfig)

    suspend fun loadBridgeConfig(): StoredBridgeConfig?

    suspend fun clearBridgeConfig()

    // User preferences
    suspend fun saveUserPreferences(prefs: StoredUserPreferences)

    suspend fun loadUserPreferences(): StoredUserPreferences?

    suspend fun clearUserPreferences()

    // Pending events (for automatic retry)
    suspend fun savePendingEvent(event: PendingEvent)

    suspend fun loadPendingEvent(eventId: String): PendingEvent?

    suspend fun loadAllPendingEvents(): List<PendingEvent>

    suspend fun deletePendingEvent(eventId: String)

    suspend fun clearAllPendingEvents()
}
