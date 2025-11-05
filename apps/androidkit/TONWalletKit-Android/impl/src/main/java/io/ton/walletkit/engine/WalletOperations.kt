package io.ton.walletkit.engine

import android.util.Log
import io.ton.walletkit.WalletKitBridgeException
import io.ton.walletkit.internal.constants.BridgeMethodConstants
import io.ton.walletkit.internal.constants.JsonConstants
import io.ton.walletkit.internal.constants.LogConstants
import io.ton.walletkit.internal.constants.ResponseConstants
import io.ton.walletkit.model.Transaction
import io.ton.walletkit.model.WalletAccount
import io.ton.walletkit.model.WalletState
import io.ton.walletkit.model.WalletSigner
import org.json.JSONArray
import org.json.JSONObject

/**
 * Encapsulates wallet lifecycle and account state operations.
 *
 * Methods here mirror the behaviour of the previous monolithic engine including logging,
 * error contracts, and result handling.
 *
 * @property ensureInitialized Suspended lambda that ensures bridge initialisation.
 * @property rpcClient Bridge RPC client wrapper.
 * @property signerManager Tracks wallet signers to maintain bridge affinity.
 * @property transactionParser Parser for transaction payloads returned by the bridge.
 * @property currentNetworkProvider Provides the latest network identifier for defaulting fields.
 *
 * @suppress Internal component used by [WebViewWalletKitEngine].
 */
internal class WalletOperations(
    private val ensureInitialized: suspend () -> Unit,
    private val rpcClient: BridgeRpcClient,
    private val signerManager: SignerManager,
    private val transactionParser: TransactionParser,
    private val currentNetworkProvider: () -> String,
) {

    /**
     * Create a v5r1 wallet instance for the provided mnemonic words.
     */
    suspend fun createV5R1Wallet(words: List<String>, network: String?): Any {
        ensureInitialized()

        val params =
            JSONObject().apply {
                put(JsonConstants.KEY_MNEMONIC, JSONArray(words))
                network?.let { put(JsonConstants.KEY_NETWORK, it) }
            }

        return rpcClient.call(BridgeMethodConstants.METHOD_CREATE_V5R1_WALLET_USING_MNEMONIC, params)
    }

    /**
     * Create a v4r2 wallet instance for the provided mnemonic words.
     */
    suspend fun createV4R2Wallet(words: List<String>, network: String?): Any {
        ensureInitialized()

        val params =
            JSONObject().apply {
                put(JsonConstants.KEY_MNEMONIC, JSONArray(words))
                network?.let { put(JsonConstants.KEY_NETWORK, it) }
            }

        return rpcClient.call(BridgeMethodConstants.METHOD_CREATE_V4R2_WALLET_USING_MNEMONIC, params)
    }

    /**
     * Add a wallet to the bridge using a signer implementation.
     */
    suspend fun addWalletWithSigner(
        signer: WalletSigner,
        version: String,
        network: String?,
    ): WalletAccount {
        ensureInitialized()

        val signerId = signerManager.registerSigner(signer)
        val normalizedVersion = version.lowercase()

        val params =
            JSONObject().apply {
                put(ResponseConstants.KEY_PUBLIC_KEY, signer.publicKey)
                put(JsonConstants.KEY_VERSION, normalizedVersion)
                put(ResponseConstants.KEY_SIGNER_ID, signerId)
                network?.let { put(JsonConstants.KEY_NETWORK, it) }
            }

        rpcClient.call(BridgeMethodConstants.METHOD_ADD_WALLET_WITH_SIGNER, params)

        val walletsResult = rpcClient.call(BridgeMethodConstants.METHOD_GET_WALLETS)
        val items = walletsResult.optJSONArray(ResponseConstants.KEY_ITEMS) ?: JSONArray()

        if (items.length() > 0) {
            val lastWallet = items.optJSONObject(items.length() - 1)
            if (lastWallet != null) {
                return WalletAccount(
                    address = lastWallet.optString(ResponseConstants.KEY_ADDRESS),
                    publicKey = lastWallet.optNullableString(ResponseConstants.KEY_PUBLIC_KEY),
                    name = lastWallet.optNullableString(JsonConstants.KEY_NAME),
                    version = lastWallet.optString(JsonConstants.KEY_VERSION, version),
                    network = lastWallet.optString(JsonConstants.KEY_NETWORK, network ?: currentNetworkProvider()),
                    index = lastWallet.optInt(ResponseConstants.KEY_INDEX, 0),
                )
            }
        }

        throw WalletKitBridgeException(ERROR_NEW_WALLET_NOT_FOUND)
    }

    /**
     * Deliver a signature or error for a signer request originating from the bridge.
     */
    suspend fun respondToSignRequest(
        signerId: String,
        requestId: String,
        signature: ByteArray?,
        error: String?,
    ) {
        ensureInitialized()

        val params =
            JSONObject().apply {
                put(ResponseConstants.KEY_SIGNER_ID, signerId)
                put(ResponseConstants.KEY_REQUEST_ID, requestId)
                signature?.let { put(ResponseConstants.KEY_SIGNATURE, it.toHexString()) }
                error?.let { put(ResponseConstants.KEY_ERROR, it) }
            }

        rpcClient.call(BridgeMethodConstants.METHOD_RESPOND_TO_SIGN_REQUEST, params)
    }

    /**
     * Fetch a list of wallets registered on the bridge.
     */
    suspend fun getWallets(): List<WalletAccount> {
        ensureInitialized()

        val result = rpcClient.call(BridgeMethodConstants.METHOD_GET_WALLETS)
        val items = result.optJSONArray(ResponseConstants.KEY_ITEMS) ?: JSONArray()

        return buildList(items.length()) {
            for (index in 0 until items.length()) {
                val entry = items.optJSONObject(index) ?: continue
                add(
                    WalletAccount(
                        address = entry.optString(ResponseConstants.KEY_ADDRESS),
                        publicKey = entry.optNullableString(ResponseConstants.KEY_PUBLIC_KEY),
                        name = entry.optNullableString(JsonConstants.KEY_NAME),
                        version = entry.optString(JsonConstants.KEY_VERSION, ResponseConstants.VALUE_UNKNOWN),
                        network = entry.optString(JsonConstants.KEY_NETWORK, currentNetworkProvider()),
                        index = entry.optInt(ResponseConstants.KEY_INDEX, index),
                    ),
                )
            }
        }
    }

    /**
     * Remove a wallet from the bridge layer.
     */
    suspend fun removeWallet(address: String) {
        ensureInitialized()

        val params = JSONObject().apply { put(ResponseConstants.KEY_ADDRESS, address) }
        val result = rpcClient.call(BridgeMethodConstants.METHOD_REMOVE_WALLET, params)
        Log.d(TAG, "removeWallet result: $result")

        val removed =
            when {
                result.has(ResponseConstants.KEY_REMOVED) -> result.optBoolean(ResponseConstants.KEY_REMOVED, false)
                result.has(ResponseConstants.KEY_OK) -> result.optBoolean(ResponseConstants.KEY_OK, true)
                result.has(ResponseConstants.KEY_VALUE) -> result.optBoolean(ResponseConstants.KEY_VALUE, true)
                else -> true
            }

        if (!removed) {
            throw WalletKitBridgeException(ERROR_FAILED_REMOVE_WALLET + address)
        }
    }

    /**
     * Retrieve wallet state including balance and parsed transactions.
     */
    suspend fun getWalletState(address: String): WalletState {
        ensureInitialized()

        val params = JSONObject().apply { put(ResponseConstants.KEY_ADDRESS, address) }
        val result = rpcClient.call(BridgeMethodConstants.METHOD_GET_WALLET_STATE, params)

        return WalletState(
            balance =
                when {
                    result.has(ResponseConstants.KEY_BALANCE) -> result.optString(ResponseConstants.KEY_BALANCE)
                    result.has(ResponseConstants.KEY_VALUE) -> result.optString(ResponseConstants.KEY_VALUE)
                    else -> null
                },
            transactions = transactionParser.parseTransactions(result.optJSONArray(ResponseConstants.KEY_TRANSACTIONS)),
        )
    }

    /**
     * Retrieve recent transactions for the requested wallet.
     */
    suspend fun getRecentTransactions(address: String, limit: Int): List<Transaction> {
        ensureInitialized()

        val params =
            JSONObject().apply {
                put(ResponseConstants.KEY_ADDRESS, address)
                put(ResponseConstants.KEY_LIMIT, limit)
            }

        val result = rpcClient.call(BridgeMethodConstants.METHOD_GET_RECENT_TRANSACTIONS, params)
        return transactionParser.parseTransactions(result.optJSONArray(ResponseConstants.KEY_ITEMS))
    }

    private fun JSONObject.optNullableString(key: String): String? {
        val value = opt(key)
        return when (value) {
            null, JSONObject.NULL -> null
            else -> value.toString()
        }
    }

    private fun ByteArray.toHexString(): String {
        if (isEmpty()) return "0x"
        val result = CharArray(size * 2 + 2)
        result[0] = '0'
        result[1] = 'x'
        val hexChars = HEX_CHARS
        for (i in indices) {
            val v = this[i].toInt() and 0xFF
            result[2 + i * 2] = hexChars[v ushr 4]
            result[3 + i * 2] = hexChars[v and 0x0F]
        }
        return String(result)
    }

    companion object {
        private val HEX_CHARS = "0123456789abcdef".toCharArray()
        private const val TAG = "${LogConstants.TAG_WEBVIEW_ENGINE}:WalletOps"

        internal const val ERROR_NEW_WALLET_NOT_FOUND = "Failed to retrieve newly added wallet"
        internal const val ERROR_FAILED_REMOVE_WALLET = "Failed to remove wallet: "
    }
}
