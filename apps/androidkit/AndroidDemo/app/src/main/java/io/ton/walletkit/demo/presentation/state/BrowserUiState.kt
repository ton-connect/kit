package io.ton.walletkit.demo.presentation.state

/**
 * UI state for the internal browser screen.
 */
data class BrowserUiState(
    val isLoading: Boolean = false,
    val currentUrl: String = "",
    val error: String? = null,
    val lastRequest: String? = null,
    val requestCount: Int = 0,
)
