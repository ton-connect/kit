package io.ton.walletkit.engine.operations

import io.ton.walletkit.engine.infrastructure.BridgeRpcClient
import io.ton.walletkit.internal.constants.BridgeMethodConstants
import io.ton.walletkit.model.TONJetton
import io.ton.walletkit.model.TONJettonTransferParams
import io.ton.walletkit.model.TONJettonWallets
import io.ton.walletkit.model.TONNFTItem
import io.ton.walletkit.model.TONNFTItems
import io.ton.walletkit.model.TONNFTTransferParamsHuman
import io.ton.walletkit.model.TONNFTTransferParamsRaw
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.json.JSONObject

/**
 * Contains NFT and Jetton related bridge calls such as listing assets and building
 * transfer transactions.
 *
 * @property ensureInitialized Suspended callback to guarantee bridge initialisation.
 * @property rpcClient Bridge RPC transport.
 * @property json Serializer for encoding and decoding bridge payloads.
 *
 * @suppress Internal component used by [WebViewWalletKitEngine].
 */
internal class AssetOperations(
    private val ensureInitialized: suspend () -> Unit,
    private val rpcClient: BridgeRpcClient,
    private val json: Json,
) {

    suspend fun getNfts(walletAddress: String, limit: Int, offset: Int): TONNFTItems {
        ensureInitialized()

        val params =
            JSONObject().apply {
                put("address", walletAddress)
                put("limit", limit)
                put("offset", offset)
            }

        val result = rpcClient.call(BridgeMethodConstants.METHOD_GET_NFTS, params)
        return json.decodeFromString(result.toString())
    }

    suspend fun getNft(nftAddress: String): TONNFTItem? {
        ensureInitialized()

        val params = JSONObject().apply { put("address", nftAddress) }
        val result = rpcClient.call(BridgeMethodConstants.METHOD_GET_NFT, params)
        return if (result.has("address")) {
            json.decodeFromString(result.toString())
        } else {
            null
        }
    }

    suspend fun createTransferNftTransaction(
        walletAddress: String,
        params: TONNFTTransferParamsHuman,
    ): String {
        ensureInitialized()

        val paramsJson =
            JSONObject().apply {
                put("address", walletAddress)
                put("nftAddress", params.nftAddress)
                put("transferAmount", params.transferAmount)
                put("toAddress", params.toAddress)
                params.comment?.let { put("comment", it) }
            }

        val result = rpcClient.call(BridgeMethodConstants.METHOD_CREATE_TRANSFER_NFT_TRANSACTION, paramsJson)
        return result.toString()
    }

    suspend fun createTransferNftRawTransaction(
        walletAddress: String,
        params: TONNFTTransferParamsRaw,
    ): String {
        ensureInitialized()

        val paramsJson =
            JSONObject(
                json.encodeToString(
                    TONNFTTransferParamsRaw.serializer(),
                    params,
                ),
            ).apply {
                put("address", walletAddress)
            }

        val result = rpcClient.call(BridgeMethodConstants.METHOD_CREATE_TRANSFER_NFT_RAW_TRANSACTION, paramsJson)
        return result.toString()
    }

    suspend fun getJettons(walletAddress: String, limit: Int, offset: Int): TONJettonWallets {
        ensureInitialized()

        val params =
            JSONObject().apply {
                put("address", walletAddress)
                put("limit", limit)
                put("offset", offset)
            }

        val result = rpcClient.call(BridgeMethodConstants.METHOD_GET_JETTONS, params)
        return json.decodeFromString(result.toString())
    }

    suspend fun getJetton(jettonAddress: String): TONJetton? {
        ensureInitialized()

        val params = JSONObject().apply { put("jettonAddress", jettonAddress) }
        val result = rpcClient.call(BridgeMethodConstants.METHOD_GET_JETTON, params)
        return if (result.has("address")) {
            json.decodeFromString(result.toString())
        } else {
            null
        }
    }

    suspend fun createTransferJettonTransaction(
        walletAddress: String,
        params: TONJettonTransferParams,
    ): String {
        ensureInitialized()

        val paramsJson =
            JSONObject().apply {
                put("address", walletAddress)
                put("toAddress", params.toAddress)
                put("jettonAddress", params.jettonAddress)
                put("amount", params.amount)
                params.comment?.let { put("comment", it) }
            }

        val result = rpcClient.call(BridgeMethodConstants.METHOD_CREATE_TRANSFER_JETTON_TRANSACTION, paramsJson)
        return result.toString()
    }

    suspend fun getJettonBalance(walletAddress: String, jettonAddress: String): String {
        ensureInitialized()

        val params =
            JSONObject().apply {
                put("address", walletAddress)
                put("jettonAddress", jettonAddress)
            }

        val result = rpcClient.call(BridgeMethodConstants.METHOD_GET_JETTON_BALANCE, params)
        return result.optString("balance", "0")
    }

    suspend fun getJettonWalletAddress(walletAddress: String, jettonAddress: String): String {
        ensureInitialized()

        val params =
            JSONObject().apply {
                put("address", walletAddress)
                put("jettonAddress", jettonAddress)
            }

        val result = rpcClient.call(BridgeMethodConstants.METHOD_GET_JETTON_WALLET_ADDRESS, params)
        return result.optString("jettonWalletAddress", "")
    }
}
