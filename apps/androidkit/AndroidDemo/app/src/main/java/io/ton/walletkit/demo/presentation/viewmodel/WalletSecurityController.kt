package io.ton.walletkit.demo.presentation.viewmodel

import io.ton.walletkit.demo.data.storage.DemoAppStorage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Handles password and unlock state, providing reactive signals for the UI layer.
 */
class WalletSecurityController(
    private val storage: DemoAppStorage,
) {

    private val _isPasswordSet = MutableStateFlow(storage.isPasswordSet())
    val isPasswordSet: StateFlow<Boolean> = _isPasswordSet.asStateFlow()

    private val _isUnlocked = MutableStateFlow(storage.isUnlocked())
    val isUnlocked: StateFlow<Boolean> = _isUnlocked.asStateFlow()

    fun setPassword(password: String) {
        storage.setPassword(password)
        storage.setUnlocked(true)
        _isPasswordSet.value = true
        _isUnlocked.value = true
    }

    fun verifyPassword(password: String): Boolean {
        val verified = storage.verifyPassword(password)
        if (verified) {
            storage.setUnlocked(true)
            _isUnlocked.value = true
        }
        return verified
    }

    fun lock() {
        _isUnlocked.value = false
        storage.setUnlocked(false)
    }

    fun reset() {
        _isPasswordSet.value = false
        _isUnlocked.value = false
    }
}
