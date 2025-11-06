package io.ton.walletkit.engine

import android.content.Context
import android.util.Log
import android.view.ViewGroup
import io.ton.walletkit.WalletKitBridgeException
import io.ton.walletkit.config.TONWalletKitConfiguration
import io.ton.walletkit.core.WalletKitEngineKind
import io.ton.walletkit.engine.infrastructure.BridgeRpcClient
import io.ton.walletkit.engine.infrastructure.InitializationManager
import io.ton.walletkit.engine.infrastructure.MessageDispatcher
import io.ton.walletkit.engine.infrastructure.StorageManager
import io.ton.walletkit.engine.infrastructure.WebViewManager
import io.ton.walletkit.engine.operations.AssetOperations
import io.ton.walletkit.engine.operations.CryptoOperations
import io.ton.walletkit.engine.operations.TonConnectOperations
import io.ton.walletkit.engine.operations.TransactionOperations
import io.ton.walletkit.engine.operations.WalletOperations
import io.ton.walletkit.engine.parsing.EventParser
import io.ton.walletkit.engine.parsing.TransactionParser
import io.ton.walletkit.engine.state.EventRouter
import io.ton.walletkit.engine.state.SignerManager
import io.ton.walletkit.event.ConnectRequestEvent
import io.ton.walletkit.event.SignDataRequestEvent
import io.ton.walletkit.event.TransactionRequestEvent
import io.ton.walletkit.internal.constants.LogConstants
import io.ton.walletkit.internal.constants.NetworkConstants
import io.ton.walletkit.internal.constants.WebViewConstants
import io.ton.walletkit.listener.TONBridgeEventsHandler
import io.ton.walletkit.model.TONJettonTransferParams
import io.ton.walletkit.model.TONJettonWallets
import io.ton.walletkit.model.TONNFTItem
import io.ton.walletkit.model.TONNFTItems
import io.ton.walletkit.model.TONNFTTransferParamsHuman
import io.ton.walletkit.model.TONNFTTransferParamsRaw
import io.ton.walletkit.model.TONNetwork
import io.ton.walletkit.model.TONTransactionPreview
import io.ton.walletkit.model.TONTransferParams
import io.ton.walletkit.model.Transaction
import io.ton.walletkit.model.WalletAccount
import io.ton.walletkit.model.WalletSession
import io.ton.walletkit.model.WalletSigner
import io.ton.walletkit.model.WalletState
import io.ton.walletkit.storage.BridgeStorageAdapter
import io.ton.walletkit.storage.SecureBridgeStorageAdapter
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
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
    private val walletOperations: WalletOperations
    private val cryptoOperations: CryptoOperations
    private val transactionOperations: TransactionOperations
    private val tonConnectOperations: TonConnectOperations
    private val assetOperations: AssetOperations

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

        val ensureInitialized: suspend () -> Unit = { ensureWalletKitInitialized() }

        walletOperations =
            WalletOperations(
                ensureInitialized = ensureInitialized,
                rpcClient = rpcClient,
                signerManager = signerManager,
                transactionParser = transactionParser,
                currentNetworkProvider = { currentNetwork },
            )
        cryptoOperations =
            CryptoOperations(
                ensureInitialized = ensureInitialized,
                rpcClient = rpcClient,
            )
        transactionOperations =
            TransactionOperations(
                ensureInitialized = ensureInitialized,
                rpcClient = rpcClient,
                json = json,
            )
        tonConnectOperations =
            TonConnectOperations(
                ensureInitialized = ensureInitialized,
                rpcClient = rpcClient,
                json = json,
            )
        assetOperations =
            AssetOperations(
                ensureInitialized = ensureInitialized,
                rpcClient = rpcClient,
                json = json,
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
    ): Any = walletOperations.createV5R1Wallet(words, network)

    override suspend fun createV4R2WalletAdapter(
        words: List<String>,
        network: String?,
    ): Any = walletOperations.createV4R2Wallet(words, network)

    override suspend fun derivePublicKeyFromMnemonic(words: List<String>): String =
        cryptoOperations.derivePublicKeyFromMnemonic(words)

    override suspend fun signDataWithMnemonic(
        words: List<String>,
        data: ByteArray,
        mnemonicType: String,
    ): ByteArray = cryptoOperations.signDataWithMnemonic(words, data, mnemonicType)

    override suspend fun createTonMnemonic(wordCount: Int): List<String> =
        cryptoOperations.createTonMnemonic(wordCount)

    override suspend fun createV4R2WalletFromMnemonic(
        mnemonic: List<String>?,
        network: String?,
    ): WalletAccount = walletOperations.createV4R2WalletUsingMnemonic(mnemonic, network)

    override suspend fun createV5R1WalletFromMnemonic(
        mnemonic: List<String>?,
        network: String?,
    ): WalletAccount = walletOperations.createV5R1WalletUsingMnemonic(mnemonic, network)

    override suspend fun createV4R2WalletFromSecretKey(
        secretKey: ByteArray,
        network: String?,
    ): WalletAccount = walletOperations.createV4R2WalletUsingSecretKey(secretKey, network)

    override suspend fun createV5R1WalletFromSecretKey(
        secretKey: ByteArray,
        network: String?,
    ): WalletAccount = walletOperations.createV5R1WalletUsingSecretKey(secretKey, network)

    override suspend fun createV4R2WalletWithSigner(
        signer: WalletSigner,
        network: String?,
    ): WalletAccount = walletOperations.createV4R2WalletWithSigner(signer, network)

    override suspend fun createV5R1WalletWithSigner(
        signer: WalletSigner,
        network: String?,
    ): WalletAccount = walletOperations.createV5R1WalletWithSigner(signer, network)

    override suspend fun respondToSignRequest(
        signerId: String,
        requestId: String,
        signature: ByteArray?,
        error: String?,
    ) = walletOperations.respondToSignRequest(signerId, requestId, signature, error)

    override suspend fun getWallets(): List<WalletAccount> = walletOperations.getWallets()

    override suspend fun removeWallet(address: String) = walletOperations.removeWallet(address)

    override suspend fun getWalletState(address: String): WalletState = walletOperations.getWalletState(address)

    override suspend fun getRecentTransactions(address: String, limit: Int): List<Transaction> =
        walletOperations.getRecentTransactions(address, limit)

    override suspend fun handleTonConnectUrl(url: String) = tonConnectOperations.handleTonConnectUrl(url)

    override suspend fun handleTonConnectRequest(
        messageId: String,
        method: String,
        paramsJson: String?,
        url: String?,
        responseCallback: (JSONObject) -> Unit,
    ) = tonConnectOperations.handleTonConnectRequest(messageId, method, paramsJson, url, responseCallback)

    override suspend fun createTransferTonTransaction(
        walletAddress: String,
        params: TONTransferParams,
    ): String = transactionOperations.createTransferTonTransaction(walletAddress, params)

    override suspend fun handleNewTransaction(
        walletAddress: String,
        transactionContent: String,
    ) = transactionOperations.handleNewTransaction(walletAddress, transactionContent)

    override suspend fun sendTransaction(
        walletAddress: String,
        transactionContent: String,
    ): String = transactionOperations.sendTransaction(walletAddress, transactionContent)

    override suspend fun approveConnect(event: ConnectRequestEvent) {
        tonConnectOperations.approveConnect(event)
    }

    override suspend fun rejectConnect(
        event: ConnectRequestEvent,
        reason: String?,
    ) = tonConnectOperations.rejectConnect(event, reason)

    override suspend fun approveTransaction(event: TransactionRequestEvent) =
        tonConnectOperations.approveTransaction(event)

    override suspend fun rejectTransaction(
        event: TransactionRequestEvent,
        reason: String?,
    ) = tonConnectOperations.rejectTransaction(event, reason)

    override suspend fun approveSignData(event: SignDataRequestEvent) =
        tonConnectOperations.approveSignData(event)

    override suspend fun rejectSignData(
        event: SignDataRequestEvent,
        reason: String?,
    ) = tonConnectOperations.rejectSignData(event, reason)

    override suspend fun listSessions(): List<WalletSession> = tonConnectOperations.listSessions()

    override suspend fun disconnectSession(sessionId: String?) =
        tonConnectOperations.disconnectSession(sessionId)

    override suspend fun getNfts(
        walletAddress: String,
        limit: Int,
        offset: Int,
    ): TONNFTItems = assetOperations.getNfts(walletAddress, limit, offset)

    override suspend fun getNft(
        nftAddress: String,
    ): TONNFTItem? = assetOperations.getNft(nftAddress)

    override suspend fun createTransferNftTransaction(
        walletAddress: String,
        params: TONNFTTransferParamsHuman,
    ): String = assetOperations.createTransferNftTransaction(walletAddress, params)

    override suspend fun createTransferNftRawTransaction(
        walletAddress: String,
        params: TONNFTTransferParamsRaw,
    ): String = assetOperations.createTransferNftRawTransaction(walletAddress, params)

    override suspend fun getJettons(
        walletAddress: String,
        limit: Int,
        offset: Int,
    ): TONJettonWallets = assetOperations.getJettons(walletAddress, limit, offset)

    override suspend fun createTransferJettonTransaction(
        walletAddress: String,
        params: TONJettonTransferParams,
    ): String = assetOperations.createTransferJettonTransaction(walletAddress, params)

    override suspend fun createTransferMultiTonTransaction(
        walletAddress: String,
        messages: List<TONTransferParams>,
    ): String = transactionOperations.createTransferMultiTonTransaction(walletAddress, messages)

    override suspend fun getTransactionPreview(
        walletAddress: String,
        transactionContent: String,
    ): TONTransactionPreview =
        transactionOperations.getTransactionPreview(walletAddress, transactionContent)

    override suspend fun getJettonBalance(walletAddress: String, jettonAddress: String): String =
        assetOperations.getJettonBalance(walletAddress, jettonAddress)

    override suspend fun getJettonWalletAddress(walletAddress: String, jettonAddress: String): String =
        assetOperations.getJettonWalletAddress(walletAddress, jettonAddress)

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
    }
}
