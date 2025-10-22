package io.ton.walletkit.presentation.browser.internal

import android.util.Log
import android.webkit.JavascriptInterface
import io.ton.walletkit.domain.constants.BrowserConstants
import org.json.JSONObject

/**
 * JavaScript interface for bridge communication.
 * Messages from injected bridge come through this interface.
 *
 * Each message includes a frameId to identify which window/iframe sent it.
 */
internal class BridgeInterface(
    private val onMessage: (message: JSONObject, type: String) -> Unit,
    private val onError: (error: String) -> Unit,
) {
    @JavascriptInterface
    fun postMessage(message: String) {
        Log.d(TAG, "🔵 BridgeInterface.postMessage called with: $message")
        try {
            val json = JSONObject(message)
            val type = json.optString(BrowserConstants.KEY_TYPE)

            Log.d(TAG, "🔵 Message type: $type")

            onMessage(json, type)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to handle bridge message", e)
            onError("Invalid bridge message: ${e.message}")
        }
    }

    companion object {
        private const val TAG = "BridgeInterface"
    }
}
