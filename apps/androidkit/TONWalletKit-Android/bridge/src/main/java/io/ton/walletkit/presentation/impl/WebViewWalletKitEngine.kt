package io.ton.walletkit.presentation.impl

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Base64
import android.util.Log
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.webkit.WebViewAssetLoader
import io.ton.walletkit.data.model.PendingEvent
import io.ton.walletkit.data.storage.WalletKitStorage
import io.ton.walletkit.data.storage.bridge.BridgeStorageAdapter
import io.ton.walletkit.data.storage.bridge.SecureBridgeStorageAdapter
import io.ton.walletkit.data.storage.impl.SecureWalletKitStorage
import io.ton.walletkit.domain.constants.BridgeMethodConstants
import io.ton.walletkit.domain.constants.EventTypeConstants
import io.ton.walletkit.domain.constants.JsonConstants
import io.ton.walletkit.domain.constants.LogConstants
import io.ton.walletkit.domain.constants.MiscConstants
import io.ton.walletkit.domain.constants.NetworkConstants
import io.ton.walletkit.domain.constants.ResponseConstants
import io.ton.walletkit.domain.constants.WebViewConstants
import io.ton.walletkit.domain.model.DAppInfo
import io.ton.walletkit.domain.model.SignDataRequest
import io.ton.walletkit.domain.model.SignDataResult
import io.ton.walletkit.domain.model.TONNetwork
import io.ton.walletkit.domain.model.Transaction
import io.ton.walletkit.domain.model.TransactionRequest
import io.ton.walletkit.domain.model.TransactionType
import io.ton.walletkit.domain.model.WalletAccount
import io.ton.walletkit.domain.model.WalletSession
import io.ton.walletkit.domain.model.WalletState
import io.ton.walletkit.presentation.WalletKitBridgeException
import io.ton.walletkit.presentation.WalletKitEngine
import io.ton.walletkit.presentation.WalletKitEngineKind
import io.ton.walletkit.presentation.config.SignDataType
import io.ton.walletkit.presentation.config.TONWalletKitConfiguration
import io.ton.walletkit.presentation.event.ConnectRequestEvent
import io.ton.walletkit.presentation.event.SignDataRequestEvent
import io.ton.walletkit.presentation.event.TONWalletKitEvent
import io.ton.walletkit.presentation.event.TransactionRequestEvent
import io.ton.walletkit.presentation.listener.TONBridgeEventsHandler
import io.ton.walletkit.presentation.request.TONWalletConnectionRequest
import io.ton.walletkit.presentation.request.TONWalletSignDataRequest
import io.ton.walletkit.presentation.request.TONWalletTransactionRequest
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.io.Closeable
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArraySet

/**
 * WebView-backed WalletKit engine. Hosts the WalletKit bundle inside a hidden WebView and uses the
 * established JS bridge to communicate with the Kotlin layer.
 *
 * **Persistent Storage**: By default, this engine persists wallet and session data
 * using secure encrypted storage. Data is automatically restored on app restart.
 * Storage can be disabled via config for testing or privacy-focused use cases.
 *
 * @suppress This is an internal implementation class. Use [WalletKitEngineFactory.create] instead.
 */
internal class WebViewWalletKitEngine(
    context: Context,
    private val assetPath: String = WebViewConstants.DEFAULT_ASSET_PATH,
) : WalletKitEngine {
    override val kind: WalletKitEngineKind = WalletKitEngineKind.WEBVIEW

    private val appContext = context.applicationContext

    // Json instance configured to ignore unknown keys (bridge may send extra fields)
    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }

    // Secure storage adapter for the bridge (conditionally enabled based on config)
    private val storageAdapter: BridgeStorageAdapter = SecureBridgeStorageAdapter(appContext)

    // Secure storage for pending events (automatic retry mechanism)
    private val eventStorage: WalletKitStorage = SecureWalletKitStorage(appContext)

    // Whether persistent storage is enabled (set during init)
    @Volatile private var persistentStorageEnabled: Boolean = true

    private val assetLoader =
        WebViewAssetLoader
            .Builder()
            .setDomain(WebViewConstants.ASSET_LOADER_DOMAIN)
            .addPathHandler(WebViewConstants.ASSET_LOADER_PATH, WebViewAssetLoader.AssetsPathHandler(appContext))
            .build()
    private val mainHandler = Handler(Looper.getMainLooper())

    // WebView must be created on main thread - using lateinit to defer creation
    private lateinit var webView: WebView

    // Signals that WebView has been created and configured
    private val webViewInitialized = CompletableDeferred<Unit>()

    // Signals that the WebView bundle finished loading and can accept bridge calls.
    private val bridgeLoaded = CompletableDeferred<Unit>()

    // Signals that the JS bridge is installed (window.__walletkitCall is defined).
    private val jsBridgeReady = CompletableDeferred<Unit>()
    private val ready = CompletableDeferred<Unit>()
    private val pending = ConcurrentHashMap<String, CompletableDeferred<BridgeResponse>>()
    private val eventHandlers = CopyOnWriteArraySet<TONBridgeEventsHandler>()

    @Volatile private var currentNetwork: String = NetworkConstants.DEFAULT_NETWORK

    @Volatile private var apiBaseUrl: String = NetworkConstants.DEFAULT_TESTNET_API_URL

    @Volatile private var tonApiKey: String? = null

    // Auto-initialization state
    @Volatile private var isWalletKitInitialized = false
    private val walletKitInitMutex = Mutex()
    private var pendingInitConfig: TONWalletKitConfiguration? = null

    init {
        // Initialize WebView synchronously if already on main thread, otherwise post to main thread
        if (Looper.myLooper() == Looper.getMainLooper()) {
            initializeWebView()
        } else {
            mainHandler.post {
                initializeWebView()
            }
        }
    }

    private fun initializeWebView() {
        try {
            Log.d(TAG, MSG_INITIALIZING_WEBVIEW_THREAD + Thread.currentThread().name)
            webView = WebView(appContext)
            WebView.setWebContentsDebuggingEnabled(true)
            webView.settings.javaScriptEnabled = true
            webView.settings.domStorageEnabled = true
            webView.settings.cacheMode = WebSettings.LOAD_NO_CACHE
            webView.settings.allowFileAccess = true
            webView.addJavascriptInterface(JsBinding(), WebViewConstants.JS_INTERFACE_NAME)
            webView.webViewClient =
                object : WebViewClient() {
                    override fun onReceivedError(
                        view: WebView?,
                        request: WebResourceRequest?,
                        error: WebResourceError?,
                    ) {
                        super.onReceivedError(view, request, error)
                        val description = error?.description?.toString() ?: ResponseConstants.VALUE_UNKNOWN
                        val failingUrl = request?.url?.toString()
                        Log.e(TAG, WebViewConstants.ERROR_WEBVIEW_LOAD_PREFIX + description + MSG_URL_SEPARATOR + (failingUrl ?: ResponseConstants.VALUE_UNKNOWN))
                        if (request?.isForMainFrame == true) {
                            val exception = WalletKitBridgeException(
                                WebViewConstants.ERROR_BUNDLE_LOAD_FAILED + MSG_OPEN_PAREN + description + MSG_CLOSE_PAREN_PERIOD_SPACE + WebViewConstants.BUILD_INSTRUCTION,
                            )
                            failBridgeFutures(exception)
                        }
                    }

                    override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                        super.onPageStarted(view, url, favicon)
                        Log.d(TAG, MSG_WEBVIEW_PAGE_STARTED + url)
                    }

                    override fun onPageFinished(view: WebView?, url: String?) {
                        super.onPageFinished(view, url)
                        Log.d(TAG, MSG_WEBVIEW_PAGE_FINISHED + url)
                        if (!bridgeLoaded.isCompleted) {
                            bridgeLoaded.complete(Unit)
                        }
                        startJsBridgeReadyPolling()
                    }

                    override fun shouldInterceptRequest(
                        view: WebView?,
                        request: WebResourceRequest?,
                    ): WebResourceResponse? {
                        val url = request?.url ?: return super.shouldInterceptRequest(view, request)
                        Log.d(TAG, MSG_WEBVIEW_INTERCEPT_REQUEST + url)
                        return assetLoader.shouldInterceptRequest(url)
                            ?: super.shouldInterceptRequest(view, request)
                    }
                }
            val safeAssetPath = assetPath.trimStart('/')
            val fullUrl = WebViewConstants.URL_PREFIX_HTTPS + WebViewConstants.ASSET_LOADER_DOMAIN + WebViewConstants.ASSET_LOADER_PATH + safeAssetPath
            Log.d(TAG, MSG_LOADING_WEBVIEW_URL + fullUrl)
            webView.loadUrl(fullUrl)
            Log.d(TAG, MSG_WEBVIEW_INITIALIZED)
            webViewInitialized.complete(Unit)
        } catch (e: Exception) {
            Log.e(TAG, MSG_FAILED_INITIALIZE_WEBVIEW, e)
            webViewInitialized.completeExceptionally(e)
            bridgeLoaded.completeExceptionally(e)
            jsBridgeReady.completeExceptionally(e)
            ready.completeExceptionally(e)
        }
    }

    /**
     * Attach the WebView to a parent view so it can be inspected/debugged if needed.
     * @suppress Internal debugging method. Not part of public API.
     */
    internal fun attachTo(parent: ViewGroup) {
        if (webView.parent !== parent) {
            (webView.parent as? ViewGroup)?.removeView(webView)
            parent.addView(webView)
        }
    }

    /**
     * Get the underlying WebView instance.
     * @suppress Internal debugging method. Not part of public API.
     */
    internal fun asView(): WebView = webView

    override fun addEventHandler(handler: TONBridgeEventsHandler): Closeable {
        eventHandlers.add(handler)

        // Replay any pending events when a handler is registered (async, non-blocking)
        if (persistentStorageEnabled) {
            CoroutineScope(Dispatchers.IO).launch {
                replayPendingEvents()
            }
        }

        return Closeable { eventHandlers.remove(handler) }
    }

    /**
     * Ensures WalletKit is initialized. If not already initialized, performs initialization
     * with the provided config or defaults. This is called automatically by all public methods
     * that require initialization, enabling auto-init behavior.
     *
     * @param config Configuration to use for initialization if not already initialized
     */
    private suspend fun ensureWalletKitInitialized(configuration: TONWalletKitConfiguration? = null) {
        // Fast path: already initialized
        if (isWalletKitInitialized) {
            return
        }

        walletKitInitMutex.withLock {
            // Double-check after acquiring lock
            if (isWalletKitInitialized) {
                return@withLock
            }

            val effectiveConfig = configuration ?: pendingInitConfig
                ?: throw WalletKitBridgeException(ERROR_INIT_CONFIG_REQUIRED)
            pendingInitConfig = null

            Log.d(TAG, ERROR_AUTO_INITIALIZING_WALLETKIT + resolveNetworkName(effectiveConfig))

            try {
                performInitialization(effectiveConfig)
                isWalletKitInitialized = true
                Log.d(TAG, ERROR_WALLETKIT_AUTO_INIT_SUCCESS)
            } catch (err: Throwable) {
                Log.e(TAG, ERROR_WALLETKIT_AUTO_INIT_FAILED, err)
                throw WalletKitBridgeException(ERROR_FAILED_AUTO_INIT_WALLETKIT + err.message)
            }
        }
    }

    /**
     * Performs the actual initialization by calling the JavaScript init method.
     */
    private suspend fun performInitialization(configuration: TONWalletKitConfiguration) {
        val networkName = resolveNetworkName(configuration)
        currentNetwork = networkName
        persistentStorageEnabled = configuration.storage.persistent

        val tonClientEndpoint = resolveTonClientEndpoint(configuration)
        apiBaseUrl = resolveTonApiBase(configuration)
        tonApiKey = configuration.apiClient?.key?.takeIf { it.isNotBlank() }

        val appVersion =
            try {
                val packageInfo = appContext.packageManager.getPackageInfo(appContext.packageName, 0)
                packageInfo.versionName ?: NetworkConstants.DEFAULT_APP_VERSION
            } catch (e: Exception) {
                Log.w(TAG, ERROR_FAILED_GET_APP_VERSION, e)
                NetworkConstants.DEFAULT_APP_VERSION
            }

        val appName =
            try {
                val manifestName = configuration.walletManifest.appName
                manifestName.ifBlank {
                    val applicationInfo = appContext.applicationInfo
                    val stringId = applicationInfo.labelRes
                    if (stringId == 0) {
                        applicationInfo.nonLocalizedLabel?.toString() ?: appContext.packageName
                    } else {
                        appContext.getString(stringId)
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, ERROR_FAILED_GET_APP_NAME, e)
                appContext.packageName
            }

        val payload =
            JSONObject().apply {
                put(JsonConstants.KEY_NETWORK, currentNetwork)
                tonClientEndpoint?.let { put(JsonConstants.KEY_API_URL, it) }
                put(JsonConstants.KEY_TON_API_URL, apiBaseUrl)

                configuration.bridge.bridgeUrl.takeIf { it.isNotBlank() }?.let { put(JsonConstants.KEY_BRIDGE_URL, it) }
                configuration.walletManifest.name.takeIf { it.isNotBlank() }?.let { put(JsonConstants.KEY_BRIDGE_NAME, it) }

                put(
                    JsonConstants.KEY_WALLET_MANIFEST,
                    JSONObject().apply {
                        put(JsonConstants.KEY_NAME, configuration.walletManifest.name)
                        put(JsonConstants.KEY_APP_NAME, appName)
                        put(JsonConstants.KEY_IMAGE_URL, configuration.walletManifest.imageUrl)
                        put(JsonConstants.KEY_ABOUT_URL, configuration.walletManifest.aboutUrl)
                        configuration.walletManifest.universalLink.takeIf { it.isNotBlank() }?.let {
                            put(JsonConstants.KEY_UNIVERSAL_URL, it)
                        }
                        put(
                            JsonConstants.KEY_PLATFORMS,
                            JSONArray().apply { put(WebViewConstants.PLATFORM_ANDROID) },
                        )
                    },
                )

                put(
                    JsonConstants.KEY_DEVICE_INFO,
                    JSONObject().apply {
                        put(JsonConstants.KEY_PLATFORM, WebViewConstants.PLATFORM_ANDROID)
                        put(JsonConstants.KEY_APP_NAME, appName)
                        put(JsonConstants.KEY_APP_VERSION, appVersion)
                        put(JsonConstants.KEY_MAX_PROTOCOL_VERSION, NetworkConstants.MAX_PROTOCOL_VERSION)
                        put(
                            JsonConstants.KEY_FEATURES,
                            JSONArray().apply {
                                put(
                                    JSONObject().apply {
                                        put(JsonConstants.KEY_NAME, JsonConstants.FEATURE_SEND_TRANSACTION)
                                        put(JsonConstants.KEY_MAX_MESSAGES, resolveMaxMessages(configuration))
                                    },
                                )
                                put(
                                    JSONObject().apply {
                                        put(JsonConstants.KEY_NAME, JsonConstants.FEATURE_SIGN_DATA)
                                        put(JsonConstants.KEY_TYPES, JSONArray(resolveSignDataTypes(configuration)))
                                    },
                                )
                            },
                        )
                    },
                )
            }

        Log.d(
            TAG,
            buildString {
                append(ERROR_INITIALIZING_WALLETKIT)
                append(persistentStorageEnabled)
                append(MSG_APP_INFO_PREFIX)
                append(appName)
                append(MSG_VERSION_PREFIX)
                append(appVersion)
            },
        )
        call(BridgeMethodConstants.METHOD_INIT, payload)
    }

    override suspend fun init(configuration: TONWalletKitConfiguration) {
        // Store config for use during auto-init if this is called before any other method
        walletKitInitMutex.withLock {
            if (!isWalletKitInitialized) {
                pendingInitConfig = configuration
            }
        }

        // Ensure initialization happens with this config
        ensureWalletKitInitialized(configuration)
    }

    override suspend fun addWalletFromMnemonic(
        words: List<String>,
        name: String?,
        version: String,
        network: String?,
    ): WalletAccount {
        ensureWalletKitInitialized()
        val params =
            JSONObject().apply {
                put(JsonConstants.KEY_WORDS, JSONArray(words))
                put(JsonConstants.KEY_VERSION, version)
                network?.let { put(JsonConstants.KEY_NETWORK, it) }
                name?.let { put(JsonConstants.KEY_NAME, it) }
            }
        val result = call(BridgeMethodConstants.METHOD_ADD_WALLET_FROM_MNEMONIC, params)

        // Parse the result into WalletAccount
        return WalletAccount(
            address = result.optString(ResponseConstants.KEY_ADDRESS),
            publicKey = result.optNullableString(ResponseConstants.KEY_PUBLIC_KEY),
            name = result.optNullableString(JsonConstants.KEY_NAME) ?: name,
            version = result.optString(JsonConstants.KEY_VERSION, version),
            network = result.optString(JsonConstants.KEY_NETWORK, network ?: currentNetwork),
            index = result.optInt(ResponseConstants.KEY_INDEX, 0),
        )
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
        Log.d(TAG, ERROR_REMOVE_WALLET_RESULT + result)

        // Check if removal was successful
        val removed = when {
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
            balance =
            when {
                result.has(ResponseConstants.KEY_BALANCE) -> result.optString(ResponseConstants.KEY_BALANCE)
                result.has(ResponseConstants.KEY_VALUE) -> result.optString(ResponseConstants.KEY_VALUE)
                else -> null
            },
            transactions = parseTransactions(result.optJSONArray(ResponseConstants.KEY_TRANSACTIONS)),
        )
    }

    override suspend fun getRecentTransactions(address: String, limit: Int): List<Transaction> {
        ensureWalletKitInitialized()
        val params = JSONObject().apply {
            put(ResponseConstants.KEY_ADDRESS, address)
            put(ResponseConstants.KEY_LIMIT, limit)
        }
        val result = call(BridgeMethodConstants.METHOD_GET_RECENT_TRANSACTIONS, params)
        return parseTransactions(result.optJSONArray(ResponseConstants.KEY_ITEMS))
    }

    /**
     * Parse JSONArray of transactions into typed Transaction list.
     * Filters out jetton/token transactions, only showing native TON transfers.
     */
    private fun parseTransactions(jsonArray: JSONArray?): List<Transaction> {
        if (jsonArray == null) return emptyList()

        return buildList(jsonArray.length()) {
            for (i in 0 until jsonArray.length()) {
                val txJson = jsonArray.optJSONObject(i) ?: continue

                // Get messages
                val inMsg = txJson.optJSONObject(ResponseConstants.KEY_IN_MSG)
                val outMsgs = txJson.optJSONArray(ResponseConstants.KEY_OUT_MSGS)

                // Filter out jetton/token transactions
                // Jetton transactions have op_code in their messages (like 0xf8a7ea5 for transfer)
                // or have a message body/payload
                val isJettonOrTokenTx = when {
                    // Check incoming message for jetton markers
                    inMsg != null -> {
                        val opCode = inMsg.optString(ResponseConstants.KEY_OP_CODE)?.takeIf { it.isNotEmpty() }
                        val body = inMsg.optString(ResponseConstants.KEY_BODY)?.takeIf { it.isNotEmpty() }
                        val message = inMsg.optString(ResponseConstants.KEY_MESSAGE)?.takeIf { it.isNotEmpty() }
                        // Has op_code or has complex body (not just a comment)
                        opCode != null || (body != null && body != ResponseConstants.VALUE_EMPTY_CELL_BODY) ||
                            (message != null && message.length > 200)
                    }
                    // Check outgoing messages for jetton markers
                    outMsgs != null && outMsgs.length() > 0 -> {
                        var hasJettonMarkers = false
                        for (j in 0 until outMsgs.length()) {
                            val msg = outMsgs.optJSONObject(j) ?: continue
                            val opCode = msg.optString(ResponseConstants.KEY_OP_CODE)?.takeIf { it.isNotEmpty() }
                            val body = msg.optString(ResponseConstants.KEY_BODY)?.takeIf { it.isNotEmpty() }
                            val message = msg.optString(ResponseConstants.KEY_MESSAGE)?.takeIf { it.isNotEmpty() }
                            if (opCode != null || (body != null && body != ResponseConstants.VALUE_EMPTY_CELL_BODY) ||
                                (message != null && message.length > 200)
                            ) {
                                hasJettonMarkers = true
                                break
                            }
                        }
                        hasJettonMarkers
                    }
                    else -> false
                }

                // Skip non-TON transactions
                if (isJettonOrTokenTx) {
                    Log.d(TAG, ERROR_SKIPPING_JETTON_TRANSACTION + txJson.optString(ResponseConstants.KEY_HASH_HEX, ResponseConstants.VALUE_UNKNOWN))
                    continue
                }

                // Determine transaction type based on incoming/outgoing value
                // Check if incoming message has value (meaning we received funds)
                val incomingValue = inMsg?.optString(ResponseConstants.KEY_VALUE)?.toLongOrNull() ?: 0L
                val hasIncomingValue = incomingValue > 0

                // Check if we have outgoing messages with value
                var outgoingValue = 0L
                if (outMsgs != null) {
                    for (j in 0 until outMsgs.length()) {
                        val msg = outMsgs.optJSONObject(j)
                        val value = msg?.optString(ResponseConstants.KEY_VALUE)?.toLongOrNull() ?: 0L
                        outgoingValue += value
                    }
                }
                val hasOutgoingValue = outgoingValue > 0

                // Transaction is INCOMING if we received value, OUTGOING if we only sent value
                // Note: Many incoming transactions also have outgoing messages (fees, change, etc.)
                val type = when {
                    hasIncomingValue -> TransactionType.INCOMING
                    hasOutgoingValue -> TransactionType.OUTGOING
                    else -> TransactionType.UNKNOWN
                }

                // Get amount based on transaction type (already calculated above)
                val amount = when (type) {
                    TransactionType.INCOMING -> incomingValue.toString()
                    TransactionType.OUTGOING -> outgoingValue.toString()
                    else -> ResponseConstants.VALUE_ZERO
                }

                // Get fee from total_fees field
                val fee = txJson.optString(ResponseConstants.KEY_TOTAL_FEES)?.takeIf { it.isNotEmpty() }

                // Get comment from messages
                val comment = when (type) {
                    TransactionType.INCOMING -> inMsg?.optString(ResponseConstants.KEY_COMMENT)?.takeIf { it.isNotEmpty() }
                    TransactionType.OUTGOING -> outMsgs?.optJSONObject(0)?.optString(ResponseConstants.KEY_COMMENT)?.takeIf { it.isNotEmpty() }
                    else -> null
                }

                // Get sender - prefer friendly address
                val sender = if (type == TransactionType.INCOMING) {
                    inMsg?.optString(ResponseConstants.KEY_SOURCE_FRIENDLY)?.takeIf { it.isNotEmpty() }
                        ?: inMsg?.optString(ResponseConstants.KEY_SOURCE)
                } else {
                    null
                }

                // Get recipient - prefer friendly address
                val recipient = if (type == TransactionType.OUTGOING) {
                    outMsgs?.optJSONObject(0)?.let { msg ->
                        msg.optString(ResponseConstants.KEY_DESTINATION_FRIENDLY)?.takeIf { it.isNotEmpty() }
                            ?: msg.optString(ResponseConstants.KEY_DESTINATION)
                    }
                } else {
                    null
                }

                // Get hash - prefer hex format
                val hash = txJson.optString(ResponseConstants.KEY_HASH_HEX)?.takeIf { it.isNotEmpty() }
                    ?: txJson.optString(JsonConstants.KEY_HASH, MiscConstants.EMPTY_STRING)

                // Get timestamp - use 'now' field and convert to milliseconds
                val timestamp = txJson.optLong(ResponseConstants.KEY_NOW, 0L) * 1000

                // Get logical time and block sequence number
                val lt = txJson.optString(JsonConstants.KEY_LT)?.takeIf { it.isNotEmpty() }
                val blockSeqno = txJson.optInt(ResponseConstants.KEY_MC_BLOCK_SEQNO, -1).takeIf { it >= 0 }

                add(
                    Transaction(
                        hash = hash,
                        timestamp = timestamp,
                        amount = amount,
                        fee = fee,
                        comment = comment,
                        sender = sender,
                        recipient = recipient,
                        type = type,
                        lt = lt,
                        blockSeqno = blockSeqno,
                    ),
                )
            }
        }
    }

    override suspend fun handleTonConnectUrl(url: String) {
        ensureWalletKitInitialized()
        val params = JSONObject().apply { put(ResponseConstants.KEY_URL, url) }
        call(BridgeMethodConstants.METHOD_HANDLE_TON_CONNECT_URL, params)
    }

    override suspend fun sendTransaction(
        walletAddress: String,
        recipient: String,
        amount: String,
        comment: String?,
    ) {
        ensureWalletKitInitialized()
        val params =
            JSONObject().apply {
                put(ResponseConstants.KEY_WALLET_ADDRESS, walletAddress)
                put(ResponseConstants.KEY_TO_ADDRESS, recipient)
                put(ResponseConstants.KEY_AMOUNT, amount)
                if (!comment.isNullOrBlank()) {
                    put(ResponseConstants.KEY_COMMENT, comment)
                }
            }
        call(BridgeMethodConstants.METHOD_SEND_TRANSACTION, params)
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

    override suspend fun approveSignData(event: SignDataRequestEvent): SignDataResult {
        ensureWalletKitInitialized()
        val eventJson = JSONObject(json.encodeToString(event))
        val params = JSONObject().apply { put(ResponseConstants.KEY_EVENT, eventJson) }
        val result = call(BridgeMethodConstants.METHOD_APPROVE_SIGN_DATA_REQUEST, params)

        Log.d(TAG, ERROR_APPROVE_SIGN_DATA_RAW_RESULT + result)

        // Extract signature from the response
        // The result might be nested in a 'result' object or directly accessible
        val signature = result.optNullableString(ResponseConstants.KEY_SIGNATURE)
            ?: result.optJSONObject(ResponseConstants.KEY_RESULT)?.optNullableString(ResponseConstants.KEY_SIGNATURE)
            ?: result.optJSONObject(ResponseConstants.KEY_DATA)?.optNullableString(ResponseConstants.KEY_SIGNATURE)

        if (signature.isNullOrEmpty()) {
            throw WalletKitBridgeException(ERROR_NO_SIGNATURE_IN_RESPONSE + result)
        }

        return SignDataResult(signature = signature)
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
        val items = result.optJSONArray(ResponseConstants.KEY_ITEMS) ?: JSONArray()
        return buildList(items.length()) {
            for (index in 0 until items.length()) {
                val entry = items.optJSONObject(index) ?: continue
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

    override suspend fun destroy() {
        withContext(Dispatchers.Main) {
            (webView.parent as? ViewGroup)?.removeView(webView)
            webView.removeJavascriptInterface(WebViewConstants.JS_INTERFACE_NAME)
            webView.stopLoading()
            webView.destroy()
        }
    }

    private fun failBridgeFutures(exception: WalletKitBridgeException) {
        if (!bridgeLoaded.isCompleted) {
            bridgeLoaded.completeExceptionally(exception)
        }
        if (!jsBridgeReady.isCompleted) {
            jsBridgeReady.completeExceptionally(exception)
        }
        if (!ready.isCompleted) {
            ready.completeExceptionally(exception)
        }
    }

    private fun markJsBridgeReady() {
        if (!jsBridgeReady.isCompleted) {
            jsBridgeReady.complete(Unit)
        }
    }

    private fun startJsBridgeReadyPolling() {
        if (jsBridgeReady.isCompleted) {
            return
        }
        mainHandler.post { pollJsBridgeReady() }
    }

    private fun pollJsBridgeReady() {
        if (jsBridgeReady.isCompleted) {
            return
        }
        try {
            webView.evaluateJavascript(WebViewConstants.JS_BRIDGE_READY_CHECK) { result ->
                val normalized = result?.trim()?.trim('"') ?: MiscConstants.EMPTY_STRING
                if (normalized.equals(WebViewConstants.JS_BOOLEAN_TRUE, ignoreCase = true)) {
                    markJsBridgeReady()
                } else {
                    mainHandler.postDelayed({ pollJsBridgeReady() }, WebViewConstants.JS_BRIDGE_POLL_DELAY_MS)
                }
            }
        } catch (err: Throwable) {
            Log.e(TAG, MSG_FAILED_EVALUATE_JS_BRIDGE, err)
            val safeMessage = err.message ?: ResponseConstants.VALUE_UNKNOWN
            val exception =
                WalletKitBridgeException(
                    WebViewConstants.ERROR_BUNDLE_LOAD_FAILED + MSG_OPEN_PAREN + safeMessage + MSG_CLOSE_PAREN_PERIOD_SPACE + WebViewConstants.BUILD_INSTRUCTION,
                )
            failBridgeFutures(exception)
        }
    }

    private suspend fun call(
        method: String,
        params: JSONObject? = null,
    ): JSONObject {
        webViewInitialized.await()
        bridgeLoaded.await()
        jsBridgeReady.await()
        // init must run before the WalletKit ready event fires, subsequent calls wait for it.
        if (method != BridgeMethodConstants.METHOD_INIT) {
            ready.await()
        }
        val callId = UUID.randomUUID().toString()
        val deferred = CompletableDeferred<BridgeResponse>()
        pending[callId] = deferred

        val payload = params?.toString()
        val idLiteral = JSONObject.quote(callId)
        val methodLiteral = JSONObject.quote(method)
        val script =
            if (payload == null) {
                buildString {
                    append(WebViewConstants.JS_FUNCTION_WALLETKIT_CALL)
                    append(JS_OPEN_PAREN)
                    append(idLiteral)
                    append(JS_PARAMETER_SEPARATOR)
                    append(methodLiteral)
                    append(JS_PARAMETER_SEPARATOR)
                    append(WebViewConstants.JS_NULL)
                    append(JS_CLOSE_PAREN)
                }
            } else {
                val payloadBase64 = Base64.encodeToString(payload.toByteArray(Charsets.UTF_8), Base64.NO_WRAP)
                val payloadLiteral = JSONObject.quote(payloadBase64)
                buildString {
                    append(WebViewConstants.JS_FUNCTION_WALLETKIT_CALL)
                    append(JS_OPEN_PAREN)
                    append(idLiteral)
                    append(JS_PARAMETER_SEPARATOR)
                    append(methodLiteral)
                    append(JS_PARAMETER_SEPARATOR)
                    append(MiscConstants.SPACE_DELIMITER)
                    append(WebViewConstants.JS_FUNCTION_ATOB)
                    append(JS_OPEN_PAREN)
                    append(payloadLiteral)
                    append(JS_CLOSE_PAREN)
                    append(JS_CLOSE_PAREN)
                }
            }

        withContext(Dispatchers.Main) {
            webView.evaluateJavascript(script, null)
        }

        val response = deferred.await()
        Log.d(TAG, ERROR_CALL_COMPLETED + method + ERROR_COMPLETED_SUFFIX)
        return response.result
    }

    private fun handleResponse(
        id: String,
        response: JSONObject,
    ) {
        val deferred = pending.remove(id) ?: return
        val error = response.optJSONObject(ResponseConstants.KEY_ERROR)
        if (error != null) {
            val message = error.optString(ResponseConstants.KEY_MESSAGE, ResponseConstants.ERROR_MESSAGE_DEFAULT)
            Log.e(TAG, ERROR_CALL_FAILED + id + ERROR_FAILED_SUFFIX + message)
            deferred.completeExceptionally(WalletKitBridgeException(message))
            return
        }
        val result = response.opt(ResponseConstants.KEY_RESULT)
        val payload =
            when (result) {
                is JSONObject -> result
                is JSONArray -> JSONObject().put(ResponseConstants.KEY_ITEMS, result)
                null -> JSONObject()
                else -> JSONObject().put(ResponseConstants.KEY_VALUE, result)
            }
        deferred.complete(BridgeResponse(payload))
    }

    private fun handleEvent(event: JSONObject) {
        val type = event.optString(JsonConstants.KEY_TYPE, EventTypeConstants.EVENT_TYPE_UNKNOWN)
        val data = event.optJSONObject(ResponseConstants.KEY_DATA) ?: JSONObject()
        val eventId = event.optString(JsonConstants.KEY_ID, UUID.randomUUID().toString())

        Log.d(TAG, MSG_HANDLE_EVENT_CALLED)
        Log.d(TAG, MSG_EVENT_TYPE_PREFIX + type)
        Log.d(TAG, MSG_EVENT_ID_PREFIX + eventId)
        Log.d(TAG, MSG_EVENT_DATA_KEYS_PREFIX + data.keys().asSequence().toList())
        Log.d(TAG, ERROR_EVENT_PREFIX + type + ERROR_BRACKET_SUFFIX)

        // Check if we have any handlers
        if (eventHandlers.isEmpty()) {
            Log.w(TAG, MSG_NO_EVENT_HANDLERS)
            if (persistentStorageEnabled) {
                saveEventForRetry(eventId, type, data.toString())
            }
            return
        }

        // Typed event handlers (sealed class)
        val typedEvent = parseTypedEvent(type, data, event)
        Log.d(TAG, MSG_PARSED_TYPED_EVENT_PREFIX + (typedEvent?.javaClass?.simpleName ?: ResponseConstants.VALUE_UNKNOWN))

        if (typedEvent != null) {
            Log.d(TAG, MSG_NOTIFYING_EVENT_HANDLERS_PREFIX + eventHandlers.size + MSG_EVENT_HANDLERS_SUFFIX)
            var anyHandlerFailed = false

            eventHandlers.forEach { handler ->
                mainHandler.post {
                    try {
                        handler.handle(typedEvent)
                        // Successfully handled, clear from storage if it was pending
                        if (persistentStorageEnabled) {
                            runBlocking {
                                eventStorage.deletePendingEvent(eventId)
                            }
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, MSG_HANDLER_EXCEPTION_PREFIX + eventId, e)
                        anyHandlerFailed = true
                        // Save for retry
                        if (persistentStorageEnabled) {
                            saveEventForRetry(eventId, type, data.toString())
                        }
                    }
                }
            }
        } else {
            Log.w(TAG, MSG_FAILED_PARSE_TYPED_EVENT_PREFIX + type)
        }
    }

    private fun parseTypedEvent(type: String, data: JSONObject, raw: JSONObject): TONWalletKitEvent? {
        return when (type) {
            EventTypeConstants.EVENT_CONNECT_REQUEST -> {
                try {
                    // Deserialize JSON into typed event
                    val event = json.decodeFromString<ConnectRequestEvent>(data.toString())
                    val dAppInfo = parseDAppInfo(data)
                    val permissions = event.preview?.permissions ?: emptyList()
                    val request = TONWalletConnectionRequest(
                        dAppInfo = dAppInfo,
                        permissions = permissions,
                        event = event,
                        engine = this,
                    )
                    TONWalletKitEvent.ConnectRequest(request)
                } catch (e: Exception) {
                    Log.e(TAG, ERROR_FAILED_PARSE_CONNECT_REQUEST, e)
                    null
                }
            }

            EventTypeConstants.EVENT_TRANSACTION_REQUEST -> {
                try {
                    // Deserialize JSON into typed event
                    val event = json.decodeFromString<TransactionRequestEvent>(data.toString())
                    val dAppInfo = parseDAppInfo(data)

                    val request = TONWalletTransactionRequest(
                        dAppInfo = dAppInfo,
                        event = event,
                        engine = this,
                    )
                    TONWalletKitEvent.TransactionRequest(request)
                } catch (e: Exception) {
                    Log.e(TAG, ERROR_FAILED_PARSE_TRANSACTION_REQUEST, e)
                    null
                }
            }

            EventTypeConstants.EVENT_SIGN_DATA_REQUEST -> {
                try {
                    // Deserialize JSON into typed event
                    val event = json.decodeFromString<SignDataRequestEvent>(data.toString())
                    val dAppInfo = parseDAppInfo(data)
                    val request = TONWalletSignDataRequest(
                        dAppInfo = dAppInfo,
                        walletAddress = event.walletAddress,
                        event = event,
                        engine = this,
                    )
                    TONWalletKitEvent.SignDataRequest(request)
                } catch (e: Exception) {
                    Log.e(TAG, ERROR_FAILED_PARSE_SIGN_DATA_REQUEST, e)
                    null
                }
            }

            EventTypeConstants.EVENT_DISCONNECT -> {
                val sessionId = data.optNullableString(ResponseConstants.KEY_SESSION_ID)
                    ?: data.optNullableString(JsonConstants.KEY_ID)
                    ?: return null
                TONWalletKitEvent.Disconnect(
                    io.ton.walletkit.presentation.event.DisconnectEvent(sessionId),
                )
            }

            EventTypeConstants.EVENT_STATE_CHANGED, EventTypeConstants.EVENT_WALLET_STATE_CHANGED -> {
                // These events are not yet supported in the public API
                null
            }

            EventTypeConstants.EVENT_SESSIONS_CHANGED -> {
                // This event is not yet supported in the public API
                null
            }

            else -> null // Unknown event type
        }
    }

    private fun parseDAppInfo(data: JSONObject): DAppInfo? {
        // Try to get dApp name from multiple sources
        val dAppName = data.optNullableString(ResponseConstants.KEY_DAPP_NAME)
            ?: data.optJSONObject(ResponseConstants.KEY_MANIFEST)?.optNullableString(JsonConstants.KEY_NAME)
            ?: data.optJSONObject(ResponseConstants.KEY_PREVIEW)?.optJSONObject(ResponseConstants.KEY_MANIFEST)?.optNullableString(JsonConstants.KEY_NAME)

        // Try to get URLs from multiple sources
        val manifest = data.optJSONObject(ResponseConstants.KEY_PREVIEW)?.optJSONObject(ResponseConstants.KEY_MANIFEST)
            ?: data.optJSONObject(ResponseConstants.KEY_MANIFEST)

        val dAppUrl = data.optNullableString(ResponseConstants.KEY_DAPP_URL_ALT)
            ?: manifest?.optNullableString(ResponseConstants.KEY_URL)
            ?: MiscConstants.EMPTY_STRING

        val iconUrl = data.optNullableString(ResponseConstants.KEY_DAPP_ICON_URL)
            ?: manifest?.optNullableString(ResponseConstants.KEY_ICON_URL_ALT)

        val manifestUrl = data.optNullableString(ResponseConstants.KEY_MANIFEST_URL_ALT)
            ?: manifest?.optNullableString(ResponseConstants.KEY_URL)

        // Only return null if we have absolutely no dApp information
        if (dAppName == null && dAppUrl.isEmpty()) {
            return null
        }

        return DAppInfo(
            name = dAppName ?: dAppUrl.takeIf { it.isNotEmpty() } ?: ResponseConstants.VALUE_UNKNOWN_DAPP,
            url = dAppUrl,
            iconUrl = iconUrl,
            manifestUrl = manifestUrl,
        )
    }

    private fun parsePermissions(data: JSONObject): List<String> {
        val permissions = data.optJSONArray(ResponseConstants.KEY_PERMISSIONS) ?: return emptyList()
        return List(permissions.length()) { i ->
            permissions.optString(i)
        }
    }

    private fun parseTransactionRequest(data: JSONObject): TransactionRequest {
        // Check if data is nested under request field
        val requestData = data.optJSONObject(ResponseConstants.KEY_REQUEST) ?: data

        // Try to parse from messages array first (TON Connect format)
        val messages = requestData.optJSONArray(ResponseConstants.KEY_MESSAGES)
        if (messages != null && messages.length() > 0) {
            val firstMessage = messages.optJSONObject(0)
            if (firstMessage != null) {
                return TransactionRequest(
                    recipient = firstMessage.optNullableString(ResponseConstants.KEY_ADDRESS)
                        ?: firstMessage.optNullableString(ResponseConstants.KEY_TO)
                        ?: MiscConstants.EMPTY_STRING,
                    amount = firstMessage.optNullableString(ResponseConstants.KEY_AMOUNT)
                        ?: firstMessage.optNullableString(ResponseConstants.KEY_VALUE)
                        ?: ResponseConstants.VALUE_ZERO,
                    comment = firstMessage.optNullableString(ResponseConstants.KEY_COMMENT)
                        ?: firstMessage.optNullableString(ResponseConstants.KEY_TEXT),
                    payload = firstMessage.optNullableString(ResponseConstants.KEY_PAYLOAD),
                )
            }
        }

        // Fallback to direct fields (legacy format or direct send)
        return TransactionRequest(
            recipient = requestData.optNullableString(ResponseConstants.KEY_TO) ?: requestData.optNullableString(ResponseConstants.KEY_RECIPIENT) ?: MiscConstants.EMPTY_STRING,
            amount = requestData.optNullableString(ResponseConstants.KEY_AMOUNT) ?: requestData.optNullableString(ResponseConstants.KEY_VALUE) ?: ResponseConstants.VALUE_ZERO,
            comment = requestData.optNullableString(ResponseConstants.KEY_COMMENT) ?: requestData.optNullableString(ResponseConstants.KEY_TEXT),
            payload = requestData.optNullableString(ResponseConstants.KEY_PAYLOAD),
        )
    }

    private fun parseSignDataRequest(data: JSONObject): SignDataRequest {
        // Parse params array - params[0] contains stringified JSON with schema_crc and payload
        var payload = data.optNullableString(ResponseConstants.KEY_PAYLOAD) ?: data.optNullableString(ResponseConstants.KEY_DATA) ?: MiscConstants.EMPTY_STRING
        var schema: String? = data.optNullableString(ResponseConstants.KEY_SCHEMA)

        // Check if params array exists (newer format from bridge)
        val paramsArray = data.optJSONArray(ResponseConstants.KEY_PARAMS)
        if (paramsArray != null && paramsArray.length() > 0) {
            val paramsString = paramsArray.optString(0)
            if (paramsString.isNotEmpty()) {
                try {
                    val paramsObj = JSONObject(paramsString)
                    payload = paramsObj.optNullableString(ResponseConstants.KEY_PAYLOAD) ?: payload

                    // Convert schema_crc to human-readable schema type
                    val schemaCrc = paramsObj.optInt(ResponseConstants.KEY_SCHEMA_CRC, -1)
                    schema = when (schemaCrc) {
                        0 -> ResponseConstants.VALUE_SCHEMA_TEXT
                        1 -> ResponseConstants.VALUE_SCHEMA_BINARY
                        2 -> ResponseConstants.VALUE_SCHEMA_CELL
                        else -> schema
                    }
                } catch (e: Exception) {
                    Log.e(TAG, ERROR_FAILED_PARSE_SIGN_DATA_PARAMS, e)
                }
            }
        }

        return SignDataRequest(
            payload = payload,
            schema = schema,
        )
    }

    private fun handleReady(payload: JSONObject) {
        payload.optNullableString(ResponseConstants.KEY_NETWORK)?.let { currentNetwork = it }
        payload.optNullableString(ResponseConstants.KEY_TON_API_URL)?.let { apiBaseUrl = it }
        if (!bridgeLoaded.isCompleted) {
            bridgeLoaded.complete(Unit)
        }
        markJsBridgeReady()
        if (!ready.isCompleted) {
            Log.d(TAG, LogConstants.MSG_BRIDGE_READY)
            ready.complete(Unit)
        }
        val data = JSONObject()
        val keys = payload.keys()
        while (keys.hasNext()) {
            val key = keys.next()
            if (key == ResponseConstants.KEY_KIND) continue
            if (payload.isNull(key)) {
                data.put(key, JSONObject.NULL)
            } else {
                data.put(key, payload.get(key))
            }
        }
        val readyEvent = JSONObject().apply {
            put(ResponseConstants.KEY_TYPE, ResponseConstants.VALUE_KIND_READY)
            put(ResponseConstants.KEY_DATA, data)
        }
        handleEvent(readyEvent)
    }

    private fun JSONObject.optNullableString(key: String): String? {
        val value = opt(key)
        return when (value) {
            null, JSONObject.NULL -> null
            else -> value.toString()
        }
    }

    private inner class JsBinding {
        @JavascriptInterface
        fun postMessage(json: String) {
            try {
                val payload = JSONObject(json)
                when (payload.optString(ResponseConstants.KEY_KIND)) {
                    ResponseConstants.VALUE_KIND_READY -> handleReady(payload)
                    ResponseConstants.VALUE_KIND_EVENT -> payload.optJSONObject(ResponseConstants.KEY_EVENT)?.let { handleEvent(it) }
                    ResponseConstants.VALUE_KIND_RESPONSE -> handleResponse(payload.optString(ResponseConstants.KEY_ID), payload)
                }
            } catch (err: JSONException) {
                Log.e(TAG, LogConstants.MSG_MALFORMED_PAYLOAD, err)
                pending.values.forEach { deferred ->
                    if (!deferred.isCompleted) {
                        deferred.completeExceptionally(WalletKitBridgeException(LogConstants.ERROR_MALFORMED_PAYLOAD_PREFIX + err.message))
                    }
                }
            }
        }

        /**
         * Storage adapter methods called by JavaScript bundle to persist data.
         * These methods enable the JS bundle to use Android secure storage instead of
         * ephemeral WebView LocalStorage.
         *
         * If persistent storage is disabled, these methods become no-ops (return null/empty).
         */
        @JavascriptInterface
        fun storageGet(key: String): String? {
            if (!persistentStorageEnabled) {
                return null // Return null when storage is disabled
            }

            return try {
                // Note: This is synchronous from JS perspective but async in Kotlin
                // We use runBlocking here as JavascriptInterface requires synchronous return
                runBlocking {
                    storageAdapter.get(key)
                }
            } catch (e: Exception) {
                Log.e(TAG, LogConstants.MSG_STORAGE_GET_FAILED + key, e)
                null
            }
        }

        @JavascriptInterface
        fun storageSet(
            key: String,
            value: String,
        ) {
            if (!persistentStorageEnabled) {
                return // No-op when storage is disabled
            }

            try {
                runBlocking {
                    storageAdapter.set(key, value)
                }
            } catch (e: Exception) {
                Log.e(TAG, LogConstants.MSG_STORAGE_SET_FAILED + key, e)
            }
        }

        @JavascriptInterface
        fun storageRemove(key: String) {
            if (!persistentStorageEnabled) {
                return // No-op when storage is disabled
            }

            try {
                runBlocking {
                    storageAdapter.remove(key)
                }
            } catch (e: Exception) {
                Log.e(TAG, LogConstants.MSG_STORAGE_REMOVE_FAILED + key, e)
            }
        }

        @JavascriptInterface
        fun storageClear() {
            if (!persistentStorageEnabled) {
                return // No-op when storage is disabled
            }

            try {
                runBlocking {
                    storageAdapter.clear()
                }
            } catch (e: Exception) {
                Log.e(TAG, LogConstants.MSG_STORAGE_CLEAR_FAILED, e)
            }
        }
    }

    /**
     * Save an event to storage for later retry.
     * Called when no handlers are registered or when a handler throws.
     */
    private fun saveEventForRetry(eventId: String, type: String, dataJson: String) {
        runBlocking {
            try {
                val event = PendingEvent(
                    id = eventId,
                    type = type,
                    data = dataJson,
                    timestamp = System.currentTimeMillis().toString(),
                    retryCount = 0,
                )
                eventStorage.savePendingEvent(event)
                Log.d(TAG, MSG_SAVED_EVENT_FOR_RETRY_PREFIX + eventId + MSG_EVENT_TYPE_LABEL + type + MSG_CLOSING_PAREN)
            } catch (e: Exception) {
                Log.e(TAG, MSG_FAILED_SAVE_EVENT_FOR_RETRY_PREFIX + eventId, e)
            }
        }
    }

    /**
     * Replay all pending events from storage.
     * Called when a new event handler is registered.
     */
    private suspend fun replayPendingEvents() {
        try {
            val pendingEvents = eventStorage.loadAllPendingEvents()
            if (pendingEvents.isEmpty()) {
                Log.d(TAG, MSG_NO_PENDING_EVENTS)
                return
            }

            Log.d(TAG, MSG_REPLAYING_PENDING_EVENTS_PREFIX + pendingEvents.size + MSG_PENDING_EVENTS_SUFFIX)

            pendingEvents.forEach { pendingEvent ->
                try {
                    // Reconstruct the event JSON
                    val eventJson = JSONObject().apply {
                        put(JsonConstants.KEY_ID, pendingEvent.id)
                        put(JsonConstants.KEY_TYPE, pendingEvent.type)
                        put(ResponseConstants.KEY_DATA, JSONObject(pendingEvent.data))
                    }

                    // Re-dispatch the event
                    mainHandler.post {
                        handleEvent(eventJson)
                    }

                    Log.d(TAG, MSG_REPLAYED_PENDING_EVENT_PREFIX + pendingEvent.id)
                } catch (e: Exception) {
                    Log.e(TAG, MSG_FAILED_REPLAY_PENDING_EVENT_PREFIX + pendingEvent.id, e)
                    // Increment retry count
                    val updated = pendingEvent.copy(retryCount = pendingEvent.retryCount + 1)
                    eventStorage.savePendingEvent(updated)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, MSG_FAILED_REPLAY_PENDING_EVENTS, e)
        }
    }

    private data class BridgeResponse(
        val result: JSONObject,
    )

    companion object {
        private const val TAG = LogConstants.TAG_WEBVIEW_ENGINE
        private const val MSG_INITIALIZING_WEBVIEW_THREAD = "Initializing WebView on thread: "
        private const val MSG_WEBVIEW_PAGE_STARTED = "WebView page started loading: "
        private const val MSG_WEBVIEW_PAGE_FINISHED = "WebView page finished loading: "
        private const val MSG_WEBVIEW_INTERCEPT_REQUEST = "WebView intercepting request: "
        private const val MSG_LOADING_WEBVIEW_URL = "Loading WebView URL: "
        private const val MSG_WEBVIEW_INITIALIZED = "WebView initialization completed, webViewInitialized completing"
        private const val MSG_FAILED_INITIALIZE_WEBVIEW = "Failed to initialize WebView"
        private const val MSG_FAILED_EVALUATE_JS_BRIDGE = "Failed to evaluate JS bridge readiness"
        private const val MSG_HANDLE_EVENT_CALLED = "=== handleEvent called ==="
        private const val MSG_EVENT_TYPE_PREFIX = "Event type: "
        private const val MSG_EVENT_ID_PREFIX = "Event ID: "
        private const val MSG_EVENT_DATA_KEYS_PREFIX = "Event data keys: "
        private const val MSG_NO_EVENT_HANDLERS = "No event handlers registered, saving event for later"
        private const val MSG_PARSED_TYPED_EVENT_PREFIX = "Parsed typed event: "
        private const val MSG_NOTIFYING_EVENT_HANDLERS_PREFIX = "Notifying "
        private const val MSG_EVENT_HANDLERS_SUFFIX = " event handlers"
        private const val MSG_HANDLER_EXCEPTION_PREFIX = "Handler threw exception for event "
        private const val MSG_FAILED_PARSE_TYPED_EVENT_PREFIX = "Failed to parse typed event for type: "
        private const val MSG_SAVED_EVENT_FOR_RETRY_PREFIX = "Saved event for retry: "
        private const val MSG_EVENT_TYPE_LABEL = " (type: "
        private const val MSG_FAILED_SAVE_EVENT_FOR_RETRY_PREFIX = "Failed to save event for retry: "
        private const val MSG_NO_PENDING_EVENTS = "No pending events to replay"
        private const val MSG_REPLAYING_PENDING_EVENTS_PREFIX = "Replaying "
        private const val MSG_PENDING_EVENTS_SUFFIX = " pending events"
        private const val MSG_REPLAYED_PENDING_EVENT_PREFIX = "Replayed pending event: "
        private const val MSG_FAILED_REPLAY_PENDING_EVENT_PREFIX = "Failed to replay pending event: "
        private const val MSG_FAILED_REPLAY_PENDING_EVENTS = "Failed to replay pending events"
        private const val MSG_CLOSING_PAREN = ")"
        private const val MSG_URL_SEPARATOR = " url="
        private const val MSG_OPEN_PAREN = " ("
        private const val MSG_CLOSE_PAREN_PERIOD_SPACE = "). "
        private const val MSG_APP_INFO_PREFIX = ", app: "
        private const val MSG_VERSION_PREFIX = " v"
        private const val JS_OPEN_PAREN = "("
        private const val JS_CLOSE_PAREN = ")"
        private const val JS_PARAMETER_SEPARATOR = ","

        // WebView and Initialization Errors
        const val ERROR_WEBVIEW_LOADING_ASSET = "WebView bridge loading asset: "
        const val ERROR_AUTO_INITIALIZING_WALLETKIT = "Auto-initializing WalletKit with config: network="
        const val ERROR_WALLETKIT_AUTO_INIT_SUCCESS = "WalletKit auto-initialization completed successfully"
        const val ERROR_WALLETKIT_AUTO_INIT_FAILED = "WalletKit auto-initialization failed"
        const val ERROR_FAILED_AUTO_INIT_WALLETKIT = "Failed to auto-initialize WalletKit: "
        const val ERROR_FAILED_GET_APP_VERSION = "Failed to get app version, using default"
        const val ERROR_FAILED_GET_APP_NAME = "Failed to get app name, using package name"
        const val ERROR_INITIALIZING_WALLETKIT = "Initializing WalletKit with persistent storage: "
        const val ERROR_INIT_CONFIG_REQUIRED = "TONWalletKit.initialize() must be called before using the SDK."

        // Wallet Operation Errors
        const val ERROR_REMOVE_WALLET_RESULT = "removeWallet result: "
        const val ERROR_FAILED_REMOVE_WALLET = "Failed to remove wallet: "
        const val ERROR_WALLET_ADDRESS_REQUIRED = "walletAddress is required for connect approval"

        // Transaction Errors
        const val ERROR_SKIPPING_JETTON_TRANSACTION = "Skipping jetton/token transaction: "

        // Sign Data Errors
        const val ERROR_APPROVE_SIGN_DATA_RAW_RESULT = "approveSignData raw result: "
        const val ERROR_NO_SIGNATURE_IN_RESPONSE = "No signature in approveSignData response: "

        // Event Parsing Errors
        const val ERROR_FAILED_PARSE_CONNECT_REQUEST = "Failed to parse ConnectRequestEvent"
        const val ERROR_FAILED_PARSE_TRANSACTION_REQUEST = "Failed to parse TransactionRequestEvent"
        const val ERROR_FAILED_PARSE_SIGN_DATA_REQUEST = "Failed to parse SignDataRequestEvent"
        const val ERROR_FAILED_PARSE_SIGN_DATA_PARAMS = "Failed to parse params for sign data"

        // Bridge Call Errors
        const val ERROR_CALL_COMPLETED = "call["
        const val ERROR_CALL_FAILED = "call["
        const val ERROR_EVENT_PREFIX = "event["
        const val ERROR_BRACKET_SUFFIX = "] "
        const val ERROR_COMPLETED_SUFFIX = "] completed"
        const val ERROR_FAILED_SUFFIX = "] failed: "

        private const val DEFAULT_MAX_MESSAGES = 4
        private val DEFAULT_SIGN_TYPES = listOf(SignDataType.TEXT, SignDataType.BINARY, SignDataType.CELL)

        private fun resolveNetworkName(configuration: TONWalletKitConfiguration): String =
            when (configuration.network) {
                TONNetwork.MAINNET -> NetworkConstants.NETWORK_MAINNET
                TONNetwork.TESTNET -> NetworkConstants.NETWORK_TESTNET
            }

        private fun resolveTonClientEndpoint(configuration: TONWalletKitConfiguration): String? =
            configuration.apiClient?.url?.takeIf { it.isNotBlank() }

        private fun resolveTonApiBase(configuration: TONWalletKitConfiguration): String {
            val custom = configuration.apiClient?.url?.takeIf { it.isNotBlank() }
            return custom ?: when (configuration.network) {
                TONNetwork.MAINNET -> NetworkConstants.DEFAULT_MAINNET_API_URL
                TONNetwork.TESTNET -> NetworkConstants.DEFAULT_TESTNET_API_URL
            }
        }

        private fun resolveMaxMessages(configuration: TONWalletKitConfiguration): Int {
            return configuration.features
                .filterIsInstance<TONWalletKitConfiguration.SendTransactionFeature>()
                .firstNotNullOfOrNull { it.maxMessages }
                ?: DEFAULT_MAX_MESSAGES
        }

        private fun resolveSignDataTypes(configuration: TONWalletKitConfiguration): List<String> {
            val types =
                configuration.features
                    .filterIsInstance<TONWalletKitConfiguration.SignDataFeature>()
                    .firstOrNull()
                    ?.types
                    ?.takeIf { it.isNotEmpty() }
                    ?: DEFAULT_SIGN_TYPES
            return types.map {
                when (it) {
                    SignDataType.TEXT -> JsonConstants.VALUE_SIGN_DATA_TEXT
                    SignDataType.BINARY -> JsonConstants.VALUE_SIGN_DATA_BINARY
                    SignDataType.CELL -> JsonConstants.VALUE_SIGN_DATA_CELL
                }
            }
        }
    }
}
