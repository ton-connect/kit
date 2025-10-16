package io.ton.walletkit.presentation.listener

import io.ton.walletkit.presentation.event.TONWalletKitEvent

/**
 * Handler for TON Wallet Kit events.
 *
 * Mirrors the canonical TON Wallet Kit protocol for cross-platform consistency.
 *
 * Implement this interface to receive events from the wallet kit
 * such as connection requests, transaction requests, and sign data requests.
 *
 * Example:
 * ```kotlin
 * class MyEventsHandler : TONBridgeEventsHandler {
 *     override fun handle(event: TONWalletKitEvent) {
 *         when (event) {
 *             is TONWalletKitEvent.ConnectRequest -> {
 *                 // Handle connection request
 *                 event.request.approve(walletAddress)
 *             }
 *             is TONWalletKitEvent.TransactionRequest -> {
 *                 // Handle transaction request
 *                 event.request.approve()
 *             }
 *             is TONWalletKitEvent.SignDataRequest -> {
 *                 // Handle sign data request
 *                 event.request.approve()
 *             }
 *             is TONWalletKitEvent.Disconnect -> {
 *                 // Handle disconnect
 *             }
 *         }
 *     }
 * }
 * ```
 */
interface TONBridgeEventsHandler {
    /**
     * Handle a wallet kit event.
     *
     * Use when() expression for exhaustive handling of all event types.
     *
     * @param event The event to handle
     */
    fun handle(event: TONWalletKitEvent)
}
