package io.ton.walletkit.presentation.extensions

import io.ton.walletkit.domain.model.WalletSession
import io.ton.walletkit.presentation.TONWalletKit
import io.ton.walletkit.presentation.WalletKitBridgeException

/**
 * Convenience extension on WalletSession to disconnect itself via the engine.
 * This keeps the session model as a simple data object and provides a small
 * ergonomic helper for callers.
 *
 * @param kit The TONWalletKit instance to use for disconnection
 */
suspend fun WalletSession.disconnect(kit: TONWalletKit) {
    val id = this.sessionId
    if (id.isBlank()) throw WalletKitBridgeException("sessionId is empty")
    kit.engine.disconnectSession(id)
}
