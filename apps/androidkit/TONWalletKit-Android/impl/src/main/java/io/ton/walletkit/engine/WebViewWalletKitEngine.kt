package io.ton.walletkit.engine

import android.content.Context
import android.util.Log
import android.view.ViewGroup
import io.ton.walletkit.WalletKitBridgeException
import io.ton.walletkit.config.TONWalletKitConfiguration
import io.ton.walletkit.core.WalletKitEngineKind
import io.ton.walletkit.event.ConnectRequestEvent
import io.ton.walletkit.event.SignDataRequestEvent
import io.ton.walletkit.event.TransactionRequestEvent
import io.ton.walletkit.internal.constants.BridgeMethodConstants
import io.ton.walletkit.internal.constants.JsonConstants
import io.ton.walletkit.internal.constants.LogConstants
import io.ton.walletkit.internal.constants.NetworkConstants
import io.ton.walletkit.internal.constants.ResponseConstants
import io.ton.walletkit.internal.constants.WebViewConstants
import io.ton.walletkit.listener.TONBridgeEventsHandler
import io.ton.walletkit.model.TONNetwork
import io.ton.walletkit.model.Transaction
import io.ton.walletkit.model.WalletAccount
import io.ton.walletkit.model.WalletSession
import io.ton.walletkit.model.WalletState
import io.ton.walletkit.model.WalletSigner
import io.ton.walletkit.storage.BridgeStorageAdapter
import io.ton.walletkit.storage.SecureBridgeStorageAdapter
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.decodeFromString
import org.json.JSONArray
import org.json.JSONObject

/**
 * Refactored WebView-backed WalletKit engine that orchestrates specialised components
 * for WebView lifecycle, RPC communication, event handling, and parsing.
 *
 * The public behaviour and logging semantics remain identical to the legacy monolithic
 * implementation to guarantee backward compatibility.
 *
 * @suppress Internal implementation class. Use [WalletKitEngineFactory.create] instead.
 */
internal class WebViewWalletKitEngine private constructor(
    context: Context,
    configuration: TONWalletKitConfiguration,
    eventsHandler: TONBridgeEventsHandler?,
    private val assetPath: String = WebViewConstants.DEFAULT_ASSET_PATH,
) : WalletKitEngine {
    override val kind: WalletKitEngineKind = WalletKitEngineKind.WEBVIEW

    private val appContext = context.applicationContext

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }

    private val storageAdapter: BridgeStorageAdapter = SecureBridgeStorageAdapter(appContext)
    @Volatile private var persistentStorageEnabled: Boolean = true
    @Volatile private var currentNetwork: String = NetworkConstants.DEFAULT_NETWORK
    @Volatile private var apiBaseUrl: String = NetworkConstants.DEFAULT_TESTNET_API_URL
    @Volatile private var tonApiKey: String? = null

    private val signerManager = SignerManager()
    private val transactionParser = TransactionParser()
    private val eventRouter = EventRouter()
    private val storageManager = StorageManager(storageAdapter) { persistentStorageEnabled }

    private val webViewManager: WebViewManager
    private val rpcClient: BridgeRpcClient
    private val initManager: InitializationManager
    private val eventParser: EventParser
    private val messageDispatcher: MessageDispatcher

    init {
        webViewManager =
            WebViewManager(
                context = appContext,
                assetPath = assetPath,
                storageManager = storageManager,
                onMessage = ::handleBridgeMessage,
                onBridgeError = ::handleBridgeError,
            )
        rpcClient = BridgeRpcClient(webViewManager)
        initManager = InitializationManager(appContext, rpcClient)
        eventParser = EventParser(json, this, signerManager)
        messageDispatcher =
            MessageDispatcher(
                rpcClient = rpcClient,
                eventParser = eventParser,
                eventRouter = eventRouter,
                initManager = initManager,
                webViewManager = webViewManager,
                onInitialized = ::refreshDerivedState,
                onNetworkChanged = ::handleNetworkChanged,
                onApiBaseUrlChanged = ::handleApiBaseUrlChanged,
            )

        if (eventsHandler != null) {
            runBlocking {
                eventRouter.addHandler(eventsHandler)
            }
        }
    }

    private suspend fun ensureWalletKitInitialized(configuration: TONWalletKitConfiguration? = null) {
        initManager.ensureInitialized(configuration)
        refreshDerivedState()
    }

    private fun refreshDerivedState() {
        persistentStorageEnabled = initManager.isPersistentStorageEnabled()
        currentNetwork = initManager.currentNetwork()
        apiBaseUrl = initManager.apiBaseUrl()
        tonApiKey = initManager.tonApiKey()
    }

    private fun handleNetworkChanged(network: String?) {
        if (!network.isNullOrBlank()) {
            currentNetwork = network
        }
    }

    private fun handleApiBaseUrlChanged(url: String?) {
        if (!url.isNullOrBlank()) {
            apiBaseUrl = url
        }
    }

    private fun handleBridgeMessage(payload: JSONObject) {
        messageDispatcher.dispatchMessage(payload)
    }

    private fun handleBridgeError(exception: WalletKitBridgeException) {
        failBridgeFutures(exception)
    }

    private suspend fun ensureEventListenersSetUp() {
        messageDispatcher.ensureEventListenersSetUp()
    }

    private suspend fun call(method: String, params: JSONObject? = null): JSONObject {
        return rpcClient.call(method, params)
    }

    /**
     * Attach the underlying WebView to a parent view so it can be inspected/debugged if needed.
     * @suppress Internal debugging method. Not part of public API.
     */
    internal fun attachTo(parent: ViewGroup) {
        webViewManager.attachTo(parent)
    }

    /**
     * Get the underlying WebView instance.
     * @suppress Internal debugging method. Not part of public API.
     */
    internal fun asView() = webViewManager.asView()

    override suspend fun init(configuration: TONWalletKitConfiguration) {
        initManager.initialize(configuration)
        refreshDerivedState()
    }

    override suspend fun createV5R1WalletAdapter(
        words: List<String>,
        network: String?,
    ): Any {
        ensureWalletKitInitialized()

        val params =
            JSONObject().apply {
                put(JsonConstants.KEY_MNEMONIC, JSONArray(words))
                network?.let { put(JsonConstants.KEY_NETWORK, it) }
            }

        return call(BridgeMethodConstants.METHOD_CREATE_V5R1_WALLET_USING_MNEMONIC, params)
    }

    override suspend fun createV4R2WalletAdapter(
        words: List<String>,
        network: String?,
    ): Any {
        ensureWalletKitInitialized()

        val params =
            JSONObject().apply {
                put(JsonConstants.KEY_MNEMONIC, JSONArray(words))
                network?.let { put(JsonConstants.KEY_NETWORK, it) }
            }

        return call(BridgeMethodConstants.METHOD_CREATE_V4R2_WALLET_USING_MNEMONIC, params)
    }

    override suspend fun derivePublicKeyFromMnemonic(words: List<String>): String {
        ensureWalletKitInitialized()
        val params =
            JSONObject().apply {
                put(JsonConstants.KEY_MNEMONIC, JSONArray(words))
            }
        val result = call(BridgeMethodConstants.METHOD_DERIVE_PUBLIC_KEY_FROM_MNEMONIC, params)
        return result.getString(ResponseConstants.KEY_PUBLIC_KEY)
    }

    override suspend fun signDataWithMnemonic(
        words: List<String>,
        data: ByteArray,
        mnemonicType: String,
    ): ByteArray {
        ensureWalletKitInitialized()
        val params =
            JSONObject().apply {
                put(JsonConstants.KEY_WORDS, JSONArray(words))
                put(JsonConstants.KEY_DATA, JSONArray(data.map { it.toInt() and 0xFF }))
                put(JsonConstants.KEY_MNEMONIC_TYPE, mnemonicType)
            }
        val result = call(BridgeMethodConstants.METHOD_SIGN_DATA_WITH_MNEMONIC, params)
        val signatureArray = result.optJSONArray(ResponseConstants.KEY_SIGNATURE)
            ?: throw WalletKitBridgeException(ERROR_SIGNATURE_MISSING_SIGN_DATA_RESULT)
        return ByteArray(signatureArray.length()) { i ->
            signatureArray.optInt(i).toByte()
        }
    }

    override suspend fun createTonMnemonic(wordCount: Int): List<String> {
        ensureWalletKitInitialized()
        val params = JSONObject().apply { put(JsonConstants.KEY_COUNT, wordCount) }
        val result = call(BridgeMethodConstants.METHOD_CREATE_TON_MNEMONIC, params)
        val items = result.optJSONArray(ResponseConstants.KEY_ITEMS)
        if (items == null) return emptyList()
        return List(items.length()) { i -> items.optString(i) }
    }

    override suspend fun addWalletWithSigner(
        signer: WalletSigner,
        version: String,
        network: String?,
    ): WalletAccount {
        ensureWalletKitInitialized()

        val signerId = signerManager.registerSigner(signer)

        val normalizedVersion = version.lowercase()
        val params =
            JSONObject().apply {
                put(ResponseConstants.KEY_PUBLIC_KEY, signer.publicKey)
                put(JsonConstants.KEY_VERSION, normalizedVersion)
                put(ResponseConstants.KEY_SIGNER_ID, signerId)
                network?.let { put(JsonConstants.KEY_NETWORK, it) }
            }

        call(BridgeMethodConstants.METHOD_ADD_WALLET_WITH_SIGNER, params)

        val walletsResult = call(BridgeMethodConstants.METHOD_GET_WALLETS)
        val items = walletsResult.optJSONArray(ResponseConstants.KEY_ITEMS) ?: JSONArray()

        if (items.length() > 0) {
            val lastWallet = items.optJSONObject(items.length() - 1)
            if (lastWallet != null) {
                return WalletAccount(
                    address = lastWallet.optString(ResponseConstants.KEY_ADDRESS),
                    publicKey = lastWallet.optNullableString(ResponseConstants.KEY_PUBLIC_KEY),
                    name = lastWallet.optNullableString(JsonConstants.KEY_NAME),
                    version = lastWallet.optString(JsonConstants.KEY_VERSION, version),
                    network = lastWallet.optString(JsonConstants.KEY_NETWORK, network ?: currentNetwork),
                    index = lastWallet.optInt(ResponseConstants.KEY_INDEX, 0),
                )
            }
        }

        throw WalletKitBridgeException(ERROR_NEW_WALLET_NOT_FOUND)
    }

    override suspend fun respondToSignRequest(
        signerId: String,
        requestId: String,
        signature: ByteArray?,
        error: String?,
    ) {
        ensureWalletKitInitialized()

        val params =
            JSONObject().apply {
                put(ResponseConstants.KEY_SIGNER_ID, signerId)
                put(ResponseConstants.KEY_REQUEST_ID, requestId)
                signature?.let { put(ResponseConstants.KEY_SIGNATURE, it.toHexString()) }
                error?.let { put(ResponseConstants.KEY_ERROR, it) }
            }

        call(BridgeMethodConstants.METHOD_RESPOND_TO_SIGN_REQUEST, params)
    }

    override suspend fun getWallets(): List<WalletAccount> {
        ensureWalletKitInitialized()
        val result = call(BridgeMethodConstants.METHOD_GET_WALLETS)
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
                        network = entry.optString(JsonConstants.KEY_NETWORK, currentNetwork),
                        index = entry.optInt(ResponseConstants.KEY_INDEX, index),
                    ),
                )
            }
        }
    }

    override suspend fun removeWallet(address: String) {
        ensureWalletKitInitialized()
        val params = JSONObject().apply { put(ResponseConstants.KEY_ADDRESS, address) }
        val result = call(BridgeMethodConstants.METHOD_REMOVE_WALLET, params)
        Log.d(TAG, "removeWallet result: $result")

        // Check if removal was successful
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

    override suspend fun getWalletState(address: String): WalletState {
        ensureWalletKitInitialized()
        val params = JSONObject().apply { put(ResponseConstants.KEY_ADDRESS, address) }
        val result = call(BridgeMethodConstants.METHOD_GET_WALLET_STATE, params)
        return WalletState(
            balance = when {
                result.has(ResponseConstants.KEY_BALANCE) -> result.optString(ResponseConstants.KEY_BALANCE)
                result.has(ResponseConstants.KEY_VALUE) -> result.optString(ResponseConstants.KEY_VALUE)
                else -> null
            },
            transactions = transactionParser.parseTransactions(result.optJSONArray(ResponseConstants.KEY_TRANSACTIONS)),
        )
    }

    override suspend fun getRecentTransactions(address: String, limit: Int): List<Transaction> {
        ensureWalletKitInitialized()
        val params =
            JSONObject().apply {
                put(ResponseConstants.KEY_ADDRESS, address)
                put(ResponseConstants.KEY_LIMIT, limit)
            }
        val result = call(BridgeMethodConstants.METHOD_GET_RECENT_TRANSACTIONS, params)
        return transactionParser.parseTransactions(result.optJSONArray(ResponseConstants.KEY_ITEMS))
    }

    override suspend fun handleTonConnectUrl(url: String) {
        ensureWalletKitInitialized()
        val params = JSONObject().apply { put(ResponseConstants.KEY_URL, url) }
        call(BridgeMethodConstants.METHOD_HANDLE_TON_CONNECT_URL, params)
    }

    override suspend fun handleTonConnectRequest(
        messageId: String,
        method: String,
        paramsJson: String?,
        url: String?,
        responseCallback: (JSONObject) -> Unit,
    ) {
        try {
            ensureWalletKitInitialized()

            Log.d(TAG, "Processing internal browser request: $method (messageId: $messageId)")
            Log.d(TAG, "dApp URL: $url")

            val params: Any? =
                when {
                    paramsJson == null -> null
                    paramsJson.trimStart().startsWith("[") -> JSONArray(paramsJson)
                    paramsJson.trimStart().startsWith("{") -> JSONObject(paramsJson)
                    else -> {
                        Log.w(TAG, "Unexpected params format: $paramsJson")
                        null
                    }
                }

            val requestParams =
                JSONObject().apply {
                    put(ResponseConstants.KEY_MESSAGE_ID, messageId)
                    put(ResponseConstants.KEY_METHOD, method)
                    if (params != null) {
                        put(ResponseConstants.KEY_PARAMS, params)
                    }
                    if (url != null) {
                        put(ResponseConstants.KEY_URL, url)
                    }
                }

            Log.d(TAG, "🔵 Calling processInternalBrowserRequest via bridge...")
            val result = call(BridgeMethodConstants.METHOD_PROCESS_INTERNAL_BROWSER_REQUEST, requestParams)

            Log.d(TAG, "🟢 Bridge call returned, result: $result")
            Log.d(TAG, "🟢 Calling responseCallback with result...")

            responseCallback(result)

            Log.d(TAG, "✅ Internal browser request processed: $method, responseCallback invoked")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to process internal browser request", e)
            val errorResponse =
                JSONObject().apply {
                    put(
                        ResponseConstants.KEY_ERROR,
                        JSONObject().apply {
                            put(ResponseConstants.KEY_MESSAGE, e.message ?: ERROR_FAILED_PROCESS_REQUEST)
                            put(ResponseConstants.KEY_CODE, 500)
                        },
                    )
                }
            responseCallback(errorResponse)
        }
    }

    override suspend fun createTransferTonTransaction(
        walletAddress: String,
        params: io.ton.walletkit.model.TONTransferParams,
    ): String {
        ensureWalletKitInitialized()
        val paramsJson =
            JSONObject().apply {
                put(ResponseConstants.KEY_WALLET_ADDRESS, walletAddress)
                put(ResponseConstants.KEY_TO_ADDRESS, params.toAddress)
                put(ResponseConstants.KEY_AMOUNT, params.amount)
                if (!params.comment.isNullOrBlank()) {
                    put(ResponseConstants.KEY_COMMENT, params.comment)
                }
                if (!params.body.isNullOrBlank()) {
                    put(ResponseConstants.KEY_BODY, params.body)
                }
                if (!params.stateInit.isNullOrBlank()) {
                    put(ResponseConstants.KEY_STATE_INIT, params.stateInit)
                }
            }
        val result = call(BridgeMethodConstants.METHOD_CREATE_TRANSFER_TON_TRANSACTION, paramsJson)
        return result.toString()
    }

    override suspend fun handleNewTransaction(
        walletAddress: String,
        transactionContent: String,
    ) {
        ensureWalletKitInitialized()
        val params =
            JSONObject().apply {
                put(ResponseConstants.KEY_WALLET_ADDRESS, walletAddress)
                put(ResponseConstants.KEY_TRANSACTION_CONTENT, transactionContent)
            }
        call(BridgeMethodConstants.METHOD_HANDLE_NEW_TRANSACTION, params)
    }

    override suspend fun sendTransaction(
        walletAddress: String,
        transactionContent: String,
    ): String {
        ensureWalletKitInitialized()
        val params =
            JSONObject().apply {
                put(ResponseConstants.KEY_WALLET_ADDRESS, walletAddress)
                put(ResponseConstants.KEY_TRANSACTION_CONTENT, transactionContent)
            }
        val result = call(BridgeMethodConstants.METHOD_SEND_TRANSACTION, params)
        return result.getString(ResponseConstants.KEY_SIGNED_BOC)
    }

    override suspend fun approveConnect(event: ConnectRequestEvent) {
        ensureWalletKitInitialized()
        val eventJson = JSONObject(json.encodeToString(event))
        val params =
            JSONObject().apply {
                put(ResponseConstants.KEY_EVENT, eventJson)
                put(ResponseConstants.KEY_WALLET_ADDRESS, event.walletAddress ?: throw WalletKitBridgeException(ERROR_WALLET_ADDRESS_REQUIRED))
            }
        call(BridgeMethodConstants.METHOD_APPROVE_CONNECT_REQUEST, params)
    }

    override suspend fun rejectConnect(
        event: ConnectRequestEvent,
        reason: String?,
    ) {
        ensureWalletKitInitialized()
        val eventJson = JSONObject(json.encodeToString(event))
        val params =
            JSONObject().apply {
                put(ResponseConstants.KEY_EVENT, eventJson)
                reason?.let { put(ResponseConstants.KEY_REASON, it) }
            }
        call(BridgeMethodConstants.METHOD_REJECT_CONNECT_REQUEST, params)
    }

    override suspend fun approveTransaction(event: TransactionRequestEvent) {
        ensureWalletKitInitialized()
        val eventJson = JSONObject(json.encodeToString(event))
        val params = JSONObject().apply { put(ResponseConstants.KEY_EVENT, eventJson) }
        call(BridgeMethodConstants.METHOD_APPROVE_TRANSACTION_REQUEST, params)
    }

    override suspend fun rejectTransaction(
        event: TransactionRequestEvent,
        reason: String?,
    ) {
        ensureWalletKitInitialized()
        val eventJson = JSONObject(json.encodeToString(event))
        val params =
            JSONObject().apply {
                put(ResponseConstants.KEY_EVENT, eventJson)
                reason?.let { put(ResponseConstants.KEY_REASON, it) }
            }
        call(BridgeMethodConstants.METHOD_REJECT_TRANSACTION_REQUEST, params)
    }

    override suspend fun approveSignData(event: SignDataRequestEvent) {
        ensureWalletKitInitialized()
        val eventJson = JSONObject(json.encodeToString(event))
        val params = JSONObject().apply { put(ResponseConstants.KEY_EVENT, eventJson) }
        call(BridgeMethodConstants.METHOD_APPROVE_SIGN_DATA_REQUEST, params)
    }

    override suspend fun rejectSignData(
        event: SignDataRequestEvent,
        reason: String?,
    ) {
        ensureWalletKitInitialized()
        val eventJson = JSONObject(json.encodeToString(event))
        val params =
            JSONObject().apply {
                put(ResponseConstants.KEY_EVENT, eventJson)
                reason?.let { put(ResponseConstants.KEY_REASON, it) }
            }
        call(BridgeMethodConstants.METHOD_REJECT_SIGN_DATA_REQUEST, params)
    }

    override suspend fun listSessions(): List<WalletSession> {
        ensureWalletKitInitialized()
        val result = call(BridgeMethodConstants.METHOD_LIST_SESSIONS)
        Log.d(TAG, "listSessions raw result: $result")
        val items = result.optJSONArray(ResponseConstants.KEY_ITEMS) ?: JSONArray()
        return buildList(items.length()) {
            for (index in 0 until items.length()) {
                val entry = items.optJSONObject(index) ?: continue
                Log.d(TAG, "listSessions entry[$index]: keys=${entry.keys().asSequence().toList()}, sessionId=${entry.optString(ResponseConstants.KEY_SESSION_ID)}")
                add(
                    WalletSession(
                        sessionId = entry.optString(ResponseConstants.KEY_SESSION_ID),
                        dAppName = entry.optString(ResponseConstants.KEY_DAPP_NAME),
                        walletAddress = entry.optString(ResponseConstants.KEY_WALLET_ADDRESS),
                        dAppUrl = entry.optNullableString(JsonConstants.KEY_DAPP_URL),
                        manifestUrl = entry.optNullableString(JsonConstants.KEY_MANIFEST_URL),
                        iconUrl = entry.optNullableString(JsonConstants.KEY_ICON_URL),
                        createdAtIso = entry.optNullableString(ResponseConstants.KEY_CREATED_AT),
                        lastActivityIso = entry.optNullableString(ResponseConstants.KEY_LAST_ACTIVITY),
                    ),
                )
            }
        }
    }

    override suspend fun disconnectSession(sessionId: String?) {
        ensureWalletKitInitialized()
        val params = JSONObject()
        sessionId?.let { params.put(ResponseConstants.KEY_SESSION_ID, it) }
        call(BridgeMethodConstants.METHOD_DISCONNECT_SESSION, if (params.length() == 0) null else params)
    }

    override suspend fun getNfts(walletAddress: String, limit: Int, offset: Int): io.ton.walletkit.model.TONNFTItems {
        ensureWalletKitInitialized()
        val params =
            JSONObject().apply {
                put("address", walletAddress)
                put("limit", limit)
                put("offset", offset)
            }
        val result = call(BridgeMethodConstants.METHOD_GET_NFTS, params)
        return json.decodeFromString(result.toString())
    }

    override suspend fun getNft(nftAddress: String): io.ton.walletkit.model.TONNFTItem? {
        ensureWalletKitInitialized()
        val params = JSONObject().apply { put("address", nftAddress) }
        val result = call(BridgeMethodConstants.METHOD_GET_NFT, params)
        return if (result.has("address")) {
            json.decodeFromString(result.toString())
        } else {
            null
        }
    }

    override suspend fun createTransferNftTransaction(
        walletAddress: String,
        params: io.ton.walletkit.model.TONNFTTransferParamsHuman,
    ): String {
        ensureWalletKitInitialized()
        val paramsJson =
            JSONObject().apply {
                put("address", walletAddress)
                put("nftAddress", params.nftAddress)
                put("transferAmount", params.transferAmount)
                put("toAddress", params.toAddress)
                params.comment?.let { put("comment", it) }
            }
        val result = call(BridgeMethodConstants.METHOD_CREATE_TRANSFER_NFT_TRANSACTION, paramsJson)
        return result.toString()
    }

    override suspend fun createTransferNftRawTransaction(
        walletAddress: String,
        params: io.ton.walletkit.model.TONNFTTransferParamsRaw,
    ): String {
        ensureWalletKitInitialized()
        val paramsJson =
            JSONObject(
                json.encodeToString(
                    io.ton.walletkit.model.TONNFTTransferParamsRaw.serializer(),
                    params,
                ),
            ).apply {
                put("address", walletAddress)
            }
        val result = call(BridgeMethodConstants.METHOD_CREATE_TRANSFER_NFT_RAW_TRANSACTION, paramsJson)
        return result.toString()
    }

    override suspend fun getJettons(walletAddress: String, limit: Int, offset: Int): io.ton.walletkit.model.TONJettonWallets {
        ensureWalletKitInitialized()
        val params =
            JSONObject().apply {
                put("address", walletAddress)
                put("limit", limit)
                put("offset", offset)
            }
        val result = call(BridgeMethodConstants.METHOD_GET_JETTONS, params)
        return json.decodeFromString(result.toString())
    }

    override suspend fun getJetton(jettonAddress: String): io.ton.walletkit.model.TONJetton? {
        ensureWalletKitInitialized()
        val params = JSONObject().apply { put("jettonAddress", jettonAddress) }
        val result = call(BridgeMethodConstants.METHOD_GET_JETTON, params)
        return if (result.has("address")) {
            json.decodeFromString(result.toString())
        } else {
            null
        }
    }

    override suspend fun createTransferJettonTransaction(
        walletAddress: String,
        params: io.ton.walletkit.model.TONJettonTransferParams,
    ): String {
        ensureWalletKitInitialized()
        val paramsJson =
            JSONObject().apply {
                put("address", walletAddress)
                put("toAddress", params.toAddress)
                put("jettonAddress", params.jettonAddress)
                put("amount", params.amount)
                params.comment?.let { put("comment", it) }
            }
        val result = call(BridgeMethodConstants.METHOD_CREATE_TRANSFER_JETTON_TRANSACTION, paramsJson)
        return result.toString()
    }

    override suspend fun createTransferMultiTonTransaction(
        walletAddress: String,
        messages: List<io.ton.walletkit.model.TONTransferParams>,
    ): String {
        ensureWalletKitInitialized()
        val messagesArray = JSONArray()
        messages.forEach { message ->
            val msgJson = JSONObject().apply {
                put("toAddress", message.toAddress)
                put("amount", message.amount)
                message.comment?.let { put("comment", it) }
                message.body?.let { put("body", it) }
                message.stateInit?.let { put("stateInit", it) }
            }
            messagesArray.put(msgJson)
        }
        val paramsJson =
            JSONObject().apply {
                put("address", walletAddress)
                put("messages", messagesArray)
            }
        val result = call(BridgeMethodConstants.METHOD_CREATE_TRANSFER_MULTI_TON_TRANSACTION, paramsJson)
        return result.toString()
    }

    override suspend fun getTransactionPreview(
        walletAddress: String,
        transactionContent: String,
    ): io.ton.walletkit.model.TONTransactionPreview {
        ensureWalletKitInitialized()
        val paramsJson =
            JSONObject().apply {
                put("address", walletAddress)
                put("transactionContent", JSONObject(transactionContent))
            }
        val result = call(BridgeMethodConstants.METHOD_GET_TRANSACTION_PREVIEW, paramsJson)
        return json.decodeFromString(io.ton.walletkit.model.TONTransactionPreview.serializer(), result.toString())
    }

    override suspend fun getJettonBalance(walletAddress: String, jettonAddress: String): String {
        ensureWalletKitInitialized()
        val params =
            JSONObject().apply {
                put("address", walletAddress)
                put("jettonAddress", jettonAddress)
            }
        val result = call(BridgeMethodConstants.METHOD_GET_JETTON_BALANCE, params)
        return result.optString("balance", "0")
    }

    override suspend fun getJettonWalletAddress(walletAddress: String, jettonAddress: String): String {
        ensureWalletKitInitialized()
        val params =
            JSONObject().apply {
                put("address", walletAddress)
                put("jettonAddress", jettonAddress)
            }
        val result = call(BridgeMethodConstants.METHOD_GET_JETTON_WALLET_ADDRESS, params)
        return result.optString("jettonWalletAddress", "")
    }

    override suspend fun callBridgeMethod(method: String, params: JSONObject?): JSONObject {
        return call(method, params)
    }

    override suspend fun addEventsHandler(eventsHandler: TONBridgeEventsHandler) {
        Log.w(TAG, "🔵🔵🔵 addEventsHandler() called!")
        Log.w(TAG, "🔵 Handler class: ${eventsHandler.javaClass.name}")
        Log.w(TAG, "🔵 Handler identity: ${System.identityHashCode(eventsHandler)}")
        Log.w(TAG, "🔵 Current handlers count: ${eventRouter.getHandlerCount()}")
        Log.w(TAG, "🔵 Current areEventListenersSetUp: ${messageDispatcher.areEventListenersSetUp()}")

        val outcome = eventRouter.addHandler(eventsHandler, logAcquired = true)

        outcome.handlersBeforeAdd.forEachIndexed { index, handler ->
            Log.d(TAG, "🔵 Existing handler[$index]: ${handler.javaClass.name} (identity: ${System.identityHashCode(handler)})")
        }

        if (outcome.alreadyRegistered) {
            Log.w(TAG, "⚠️⚠️⚠️ Handler already registered (found via .contains()), skipping!")
            Log.w(TAG, "🔵 eventHandlersMutex released, shouldSetupListeners=${outcome.isFirstHandler}")
            return
        }

        Log.w(TAG, "✅✅✅ Added event handler! Total handlers: ${eventRouter.getHandlerCount()}, isFirstHandler=${outcome.isFirstHandler}")
        Log.w(TAG, "🔵 eventHandlersMutex released, shouldSetupListeners=${outcome.isFirstHandler}")

        if (outcome.isFirstHandler) {
            Log.w(TAG, "🔵🔵🔵 First handler registered, setting up event listeners...")
            ensureEventListenersSetUp()
            Log.w(TAG, "✅✅✅ Event listener setup complete after first handler registration")
        } else {
            Log.w(TAG, "⚡⚡⚡ Not first handler, event listeners should already be set up (areEventListenersSetUp=${messageDispatcher.areEventListenersSetUp()})")
        }
    }

    override suspend fun removeEventsHandler(eventsHandler: TONBridgeEventsHandler) {
        val outcome = eventRouter.removeHandler(eventsHandler)
        if (outcome.removed) {
            Log.d(TAG, "Removed event handler: ${eventsHandler.javaClass.simpleName}. Total handlers: ${eventRouter.getHandlerCount()}")

            if (outcome.isEmpty && messageDispatcher.areEventListenersSetUp()) {
                try {
                    messageDispatcher.removeEventListenersIfNeeded()
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to remove event listeners from JS bridge", e)
                }
            }
        }
    }

    override suspend fun destroy() {
        withContext(Dispatchers.Main) {
            try {
                if (initManager.isInitialized()) {
                    Log.d(TAG, "Removing event listeners before destroy...")
                    messageDispatcher.removeEventListenersIfNeeded()
                }
            } catch (e: Exception) {
                Log.w(TAG, "Failed to remove event listeners during destroy", e)
            }

            webViewManager.destroy()
        }
    }

    private fun failBridgeFutures(exception: WalletKitBridgeException) {
        if (!webViewManager.bridgeLoaded.isCompleted) {
            webViewManager.bridgeLoaded.completeExceptionally(exception)
        }
        if (!webViewManager.jsBridgeReady.isCompleted) {
            webViewManager.jsBridgeReady.completeExceptionally(exception)
        }
        rpcClient.failAll(exception)
    }

    private fun JSONObject.optNullableString(key: String): String? {
        val value = opt(key)
        return when (value) {
            null, JSONObject.NULL -> null
            else -> value.toString()
        }
    }

    companion object {
        private val instances = mutableMapOf<TONNetwork, WebViewWalletKitEngine>()
        private val instanceMutex = Mutex()

        suspend fun getOrCreate(
            context: Context,
            configuration: TONWalletKitConfiguration,
            eventsHandler: TONBridgeEventsHandler?,
            assetPath: String = WebViewConstants.DEFAULT_ASSET_PATH,
        ): WebViewWalletKitEngine {
            val network = configuration.network

            instances[network]?.let { existingInstance ->
                Log.w(TAG, "♻️♻️♻️ Reusing existing WebView engine for network: $network")
                if (eventsHandler != null) {
                    if (!existingInstance.eventRouter.containsHandler(eventsHandler)) {
                        existingInstance.addEventsHandler(eventsHandler)
                    }
                }
                return existingInstance
            }

            val instance =
                instanceMutex.withLock {
                    instances[network]?.let {
                        Log.w(TAG, "♻️♻️♻️ Reusing existing WebView engine for network: $network (after lock)")
                        return@withLock it
                    }

                    Log.w(TAG, "🔶🔶🔶 Creating NEW WebView engine for network: $network")
                    WebViewWalletKitEngine(context, configuration, eventsHandler, assetPath).also {
                        instances[network] = it
                    }
                }

            if (eventsHandler != null) {
                if (!instance.eventRouter.containsHandler(eventsHandler)) {
                    instance.addEventsHandler(eventsHandler)
                }
            }

            return instance
        }

        @JvmStatic
        internal suspend fun clearInstances(network: TONNetwork? = null) {
            instanceMutex.withLock {
                if (network != null) {
                    instances[network]?.destroy()
                    instances.remove(network)
                    Log.w(TAG, "🗑️ Cleared WebView engine for network: $network")
                } else {
                    instances.values.forEach { it.destroy() }
                    instances.clear()
                    Log.w(TAG, "🗑️ Cleared all WebView engine instances")
                }
            }
        }

        private const val TAG = LogConstants.TAG_WEBVIEW_ENGINE
        private const val ERROR_NEW_WALLET_NOT_FOUND = "Failed to retrieve newly added wallet"
        const val ERROR_FAILED_REMOVE_WALLET = "Failed to remove wallet: "
        const val ERROR_WALLET_ADDRESS_REQUIRED = "walletAddress is required for connect approval"
        private const val ERROR_SIGNATURE_MISSING_SIGN_DATA_RESULT = "Signature missing from signDataWithMnemonic result"
        const val ERROR_FAILED_PROCESS_REQUEST = "Failed to process request"
    }
}

private fun ByteArray.toHexString(): String {
    if (isEmpty()) return "0x"
    val result = CharArray(size * 2 + 2)
    result[0] = '0'
    result[1] = 'x'
    val hexChars = "0123456789abcdef".toCharArray()
    for (i in indices) {
        val v = this[i].toInt() and 0xFF
        result[2 + i * 2] = hexChars[v ushr 4]
        result[3 + i * 2] = hexChars[v and 0x0F]
    }
    return String(result)
}
