package io.ton.walletkit.demo.presentation.viewmodel

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import io.ton.walletkit.demo.presentation.model.SessionSummary
import io.ton.walletkit.demo.presentation.util.TimestampParser
import io.ton.walletkit.demo.presentation.util.UrlSanitizer
import io.ton.walletkit.model.WalletSession
import io.ton.walletkit.ITONWallet
import io.ton.walletkit.ITONWalletKit
import io.ton.walletkit.extensions.disconnect
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * ViewModel for managing TON Connect sessions.
 * Handles session listing, disconnection, and refresh.
 */
class SessionsViewModel(
    private val getAllWallets: () -> List<ITONWallet>,
    private val getKit: () -> ITONWalletKit,
    private val unknownDAppLabel: String = "Unknown dApp",
) : ViewModel() {

    private val _state = MutableStateFlow(SessionsState())
    val state: StateFlow<SessionsState> = _state.asStateFlow()

    data class SessionsState(
        val sessions: List<SessionSummary> = emptyList(),
        val isLoading: Boolean = false,
        val error: String? = null,
    )

    init {
        Log.d(TAG, "SessionsViewModel created")
    }

    override fun onCleared() {
        super.onCleared()
        Log.d(TAG, "SessionsViewModel cleared")
    }

    /**
     * Load sessions from all wallets.
     */
    fun loadSessions() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)

            try {
                val allSessions = mutableListOf<WalletSession>()
                val wallets = getAllWallets()

                Log.d(TAG, "Loading sessions from ${wallets.size} wallets")

                wallets.forEach { wallet ->
                    runCatching {
                        val walletSessions = wallet.sessions()
                        allSessions.addAll(walletSessions)
                    }.onFailure { error ->
                        Log.w(TAG, "Failed to get sessions for wallet ${wallet.address}", error)
                    }
                }

                Log.d(TAG, "Loaded ${allSessions.size} total sessions")

                val mapped = allSessions.mapNotNull { session ->
                    val sessionUrl = UrlSanitizer.sanitize(session.dAppUrl)
                    val sessionManifest = UrlSanitizer.sanitize(session.manifestUrl)
                    val sessionIcon = UrlSanitizer.sanitize(session.iconUrl)

                    // Skip sessions with no metadata (appears disconnected)
                    val appearsDisconnected = sessionUrl == null && sessionManifest == null
                    if (appearsDisconnected && session.sessionId.isNotBlank()) {
                        Log.d(TAG, "Skipping session with empty metadata: ${session.sessionId}")
                        return@mapNotNull null
                    }

                    val displayName = session.dAppName.ifBlank { unknownDAppLabel }

                    SessionSummary(
                        sessionId = session.sessionId,
                        dAppName = displayName,
                        walletAddress = session.walletAddress,
                        dAppUrl = sessionUrl,
                        manifestUrl = sessionManifest,
                        iconUrl = sessionIcon,
                        createdAt = TimestampParser.parse(session.createdAtIso),
                        lastActivity = TimestampParser.parse(session.lastActivityIso),
                    )
                }

                _state.value = _state.value.copy(
                    sessions = mapped,
                    isLoading = false,
                    error = null,
                )

                Log.d(TAG, "Mapped ${mapped.size} session summaries")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to load sessions", e)
                _state.value = _state.value.copy(
                    isLoading = false,
                    error = e.message ?: "Failed to load sessions",
                )
            }
        }
    }

    /**
     * Disconnect a specific session.
     */
    fun disconnectSession(sessionId: String) {
        viewModelScope.launch {
            _state.value = _state.value.copy(error = null)

            try {
                Log.d(TAG, "Disconnecting session: $sessionId")

                var disconnected = false
                val kit = getKit()
                val wallets = getAllWallets()

                // Find the session in any wallet and disconnect it
                for (wallet in wallets) {
                    val sessions = runCatching { wallet.sessions() }.getOrNull() ?: continue
                    val domainSession = sessions.firstOrNull { it.sessionId == sessionId }
                    if (domainSession != null) {
                        domainSession.disconnect(kit)
                        disconnected = true
                        Log.d(TAG, "Disconnected session $sessionId from wallet ${wallet.address}")
                        break
                    }
                }

                if (!disconnected) {
                    Log.w(TAG, "Session not found: $sessionId")
                    _state.value = _state.value.copy(error = "Session not found")
                    return@launch
                }

                // Refresh sessions after disconnection
                loadSessions()
            } catch (e: Exception) {
                Log.e(TAG, "Failed to disconnect session $sessionId", e)
                _state.value = _state.value.copy(
                    error = e.message ?: "Failed to disconnect session",
                )

                // Still refresh to update UI
                loadSessions()
            }
        }
    }

    /**
     * Refresh sessions from all wallets.
     */
    fun refresh() {
        loadSessions()
    }

    /**
     * Clear error message.
     */
    fun clearError() {
        _state.value = _state.value.copy(error = null)
    }

    companion object {
        private const val TAG = "SessionsViewModel"
    }
}
