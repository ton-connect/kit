package io.ton.walletkit.event

/**
 * Events emitted by the internal browser.
 */
sealed class BrowserEvent {
    /**
     * Page started loading.
     */
    data class PageStarted(val url: String) : BrowserEvent()

    /**
     * Page finished loading.
     */
    data class PageFinished(val url: String) : BrowserEvent()

    /**
     * Error occurred.
     */
    data class Error(val message: String) : BrowserEvent()

    /**
     * Bridge request received from dApp (connect, send transaction, etc.).
     * The SDK automatically forwards this to WalletKit engine for processing.
     * This event is for UI updates (showing notifications, etc.).
     */
    data class BridgeRequest(
        val messageId: String,
        val method: String,
        val request: String,
    ) : BrowserEvent()
}
