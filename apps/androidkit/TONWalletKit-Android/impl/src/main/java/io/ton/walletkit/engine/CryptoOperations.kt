package io.ton.walletkit.engine

import android.util.Log
import io.ton.walletkit.WalletKitBridgeException
import io.ton.walletkit.internal.constants.BridgeMethodConstants
import io.ton.walletkit.internal.constants.JsonConstants
import io.ton.walletkit.internal.constants.LogConstants
import io.ton.walletkit.internal.constants.ResponseConstants
import org.json.JSONArray
import org.json.JSONObject

/**
 * Handles cryptographic bridge operations such as mnemonic generation, key derivation,
 * and data signing. Each call ensures the bridge is initialised before delegating to
 * the JavaScript transport.
 *
 * Behaviour and exception semantics match the legacy [WebViewWalletKitEngine] directly.
 *
 * @property ensureInitialized Suspended function that guarantees WalletKit initialisation.
 * @property rpcClient RPC client used for bridge communication.
 *
 * @suppress Internal component consumed by [WebViewWalletKitEngine].
 */
internal class CryptoOperations(
    private val ensureInitialized: suspend () -> Unit,
    private val rpcClient: BridgeRpcClient,
) {

    /**
     * Generate a TON mnemonic of the given size.
     *
     * @param wordCount Number of mnemonic words to generate.
     * @return Generated mnemonic words. Returns an empty list if bridge response omits items.
     * @throws WalletKitBridgeException If the bridge call fails.
     */
    suspend fun createTonMnemonic(wordCount: Int): List<String> {
        ensureInitialized()

        val params =
            JSONObject().apply {
                put(JsonConstants.KEY_COUNT, wordCount)
            }

        val result = rpcClient.call(BridgeMethodConstants.METHOD_CREATE_TON_MNEMONIC, params)
        val items = result.optJSONArray(ResponseConstants.KEY_ITEMS)
        if (items == null) {
            Log.w(TAG, "Mnemonic generation returned no items (wordCount=$wordCount)")
            return emptyList()
        }

        return List(items.length()) { index -> items.optString(index) }
    }

    /**
     * Derive a hex-encoded public key from the provided mnemonic words.
     *
     * @param words Mnemonic seed words.
     * @return Hex-encoded public key.
     * @throws WalletKitBridgeException If the bridge call fails.
     */
    suspend fun derivePublicKeyFromMnemonic(words: List<String>): String {
        ensureInitialized()

        val params =
            JSONObject().apply {
                put(JsonConstants.KEY_MNEMONIC, JSONArray(words))
            }

        val result = rpcClient.call(BridgeMethodConstants.METHOD_DERIVE_PUBLIC_KEY_FROM_MNEMONIC, params)
        return result.getString(ResponseConstants.KEY_PUBLIC_KEY)
    }

    /**
     * Sign arbitrary data with the provided mnemonic.
     *
     * @param words Mnemonic seed words.
     * @param data Payload that should be signed.
     * @param mnemonicType Mnemonic type required by the bridge (e.g. "ton" or "bip39").
     * @return Signature bytes returned by the bridge.
     * @throws WalletKitBridgeException If the bridge call fails or omits the signature.
     */
    suspend fun signDataWithMnemonic(
        words: List<String>,
        data: ByteArray,
        mnemonicType: String,
    ): ByteArray {
        ensureInitialized()

        val params =
            JSONObject().apply {
                put(JsonConstants.KEY_WORDS, JSONArray(words))
                put(JsonConstants.KEY_DATA, JSONArray(data.map { it.toInt() and 0xFF }))
                put(JsonConstants.KEY_MNEMONIC_TYPE, mnemonicType)
            }

        val result = rpcClient.call(BridgeMethodConstants.METHOD_SIGN_DATA_WITH_MNEMONIC, params)
        val signatureArray =
            result.optJSONArray(ResponseConstants.KEY_SIGNATURE)
                ?: throw WalletKitBridgeException(ERROR_SIGNATURE_MISSING_SIGN_DATA_RESULT)

        return ByteArray(signatureArray.length()) { index ->
            signatureArray.optInt(index).toByte()
        }
    }

    companion object {
        private const val TAG = "${LogConstants.TAG_WEBVIEW_ENGINE}:CryptoOps"
        private const val ERROR_SIGNATURE_MISSING_SIGN_DATA_RESULT =
            "Signature missing from signDataWithMnemonic result"
    }
}
