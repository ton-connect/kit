package io.ton.walletkit.demo.presentation.viewmodel

import androidx.annotation.StringRes
import io.ton.walletkit.demo.presentation.state.WalletUiState
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/**
 * Maintains the rolling event log and temporary status messages.
 */
class WalletEventLogger(
    private val state: MutableStateFlow<WalletUiState>,
    private val scope: CoroutineScope,
    private val maxEvents: Int,
    private val hideDelayMillis: Long,
    private val defaultStatusProvider: () -> String,
    private val stringProvider: (Int, Array<out Any>) -> String,
) {

    fun log(@StringRes resId: Int, vararg args: Any) {
        log(stringProvider(resId, args))
    }

    fun log(message: String) {
        state.update {
            val events = listOf(message) + it.events
            it.copy(events = events.take(maxEvents))
        }
    }

    fun showTemporaryStatus(message: String) {
        state.update { it.copy(status = message, error = null) }
        scope.launch {
            delay(hideDelayMillis)
            state.update { current ->
                if (current.status == message) {
                    current.copy(status = defaultStatusProvider())
                } else {
                    current
                }
            }
        }
    }
}
