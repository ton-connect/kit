package io.ton.walletkit.extensions

import io.ton.walletkit.ITONWalletKit
import io.ton.walletkit.WalletKitBridgeException
import io.ton.walletkit.model.WalletSession

/**
 * Convenience extension on WalletSession to disconnect itself via the kit.
 * This keeps the session model as a simple data object and provides an
 * ergonomic helper for callers.
 *
 * @param kit The ITONWalletKit instance to use for disconnection
 */
suspend fun WalletSession.disconnect(kit: ITONWalletKit) {
    if (sessionId.isBlank()) {
        throw WalletKitBridgeException("Session ID is empty")
    }
    kit.disconnectSession(sessionId)
}
