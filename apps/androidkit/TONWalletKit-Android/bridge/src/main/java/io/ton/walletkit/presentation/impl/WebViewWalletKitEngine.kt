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
import io.ton.walletkit.domain.model.Transaction
import io.ton.walletkit.domain.model.TransactionRequest
import io.ton.walletkit.domain.model.TransactionType
import io.ton.walletkit.domain.model.WalletAccount
import io.ton.walletkit.domain.model.WalletSession
import io.ton.walletkit.domain.model.WalletState
import io.ton.walletkit.presentation.WalletKitBridgeException
import io.ton.walletkit.presentation.WalletKitEngine
import io.ton.walletkit.presentation.WalletKitEngineKind
import io.ton.walletkit.presentation.config.WalletKitBridgeConfig
import io.ton.walletkit.presentation.event.ConnectRequestEvent
import io.ton.walletkit.presentation.event.SignDataRequestEvent
import io.ton.walletkit.presentation.event.TransactionRequestEvent
import io.ton.walletkit.presentation.event.WalletKitEvent
import io.ton.walletkit.presentation.listener.WalletKitEventHandler
import io.ton.walletkit.presentation.request.ConnectRequest
import io.ton.walletkit.presentation.storage.bridge.BridgeStorageAdapter
import io.ton.walletkit.presentation.storage.bridge.SecureBridgeStorageAdapter
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
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
 */
class WebViewWalletKitEngine(
    context: Context,
    private val assetPath: String = WebViewConstants.DEFAULT_ASSET_PATH,
) : WalletKitEngine {
    override val kind: WalletKitEngineKind = WalletKitEngineKind.WEBVIEW

    private val logTag = WebViewConstants.LOG_TAG_WEBVIEW
    private val appContext = context.applicationContext

    // Json instance configured to ignore unknown keys (bridge may send extra fields)
    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }

    // Secure storage adapter for the bridge (conditionally enabled based on config)
    private val storageAdapter: BridgeStorageAdapter = SecureBridgeStorageAdapter(appContext)

    // Whether persistent storage is enabled (set during init)
    @Volatile private var persistentStorageEnabled: Boolean = true

    private val assetLoader =
        WebViewAssetLoader
            .Builder()
            .setDomain(WebViewConstants.ASSET_LOADER_DOMAIN)
            .addPathHandler(WebViewConstants.ASSET_LOADER_PATH, WebViewAssetLoader.AssetsPathHandler(appContext))
            .build()
    private val mainHandler = Handler(Looper.getMainLooper())
    private val webView: WebView = WebView(appContext)
    private val ready = CompletableDeferred<Unit>()
    private val pending = ConcurrentHashMap<String, CompletableDeferred<BridgeResponse>>()
    private val eventHandlers = CopyOnWriteArraySet<WalletKitEventHandler>()

    @Volatile private var currentNetwork: String = NetworkConstants.DEFAULT_NETWORK

    @Volatile private var apiBaseUrl: String = NetworkConstants.DEFAULT_TESTNET_API_URL

    @Volatile private var tonApiKey: String? = null

    // Auto-initialization state
    @Volatile private var isWalletKitInitialized = false
    private val walletKitInitMutex = Mutex()
    private var pendingInitConfig: WalletKitBridgeConfig? = null

    init {
        mainHandler.post {
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
                        Log.e(logTag, "${WebViewConstants.ERROR_WEBVIEW_LOAD_PREFIX}$description url=$failingUrl")
                        if (request?.isForMainFrame == true && !ready.isCompleted) {
                            ready.completeExceptionally(
                                WalletKitBridgeException(
                                    "${WebViewConstants.ERROR_BUNDLE_LOAD_FAILED} ($description). ${WebViewConstants.BUILD_INSTRUCTION}",
                                ),
                            )
                        }
                    }

                    override fun shouldInterceptRequest(
                        view: WebView?,
                        request: WebResourceRequest?,
                    ): WebResourceResponse? {
                        val url = request?.url ?: return super.shouldInterceptRequest(view, request)
                        return assetLoader.shouldInterceptRequest(url)
                            ?: super.shouldInterceptRequest(view, request)
                    }
                }
            val safeAssetPath = assetPath.trimStart('/')
            webView.loadUrl(WebViewConstants.URL_PREFIX_HTTPS + WebViewConstants.ASSET_LOADER_DOMAIN + WebViewConstants.ASSET_LOADER_PATH + safeAssetPath)
            Log.d(logTag, ERROR_WEBVIEW_LOADING_ASSET + assetPath)
        }
    }

    /** Attach the WebView to a parent view so it can be inspected/debugged if needed. */
    fun attachTo(parent: ViewGroup) {
        if (webView.parent !== parent) {
            (webView.parent as? ViewGroup)?.removeView(webView)
            parent.addView(webView)
        }
    }

    fun asView(): WebView = webView

    override fun addEventHandler(handler: WalletKitEventHandler): Closeable {
        eventHandlers.add(handler)
        return Closeable { eventHandlers.remove(handler) }
    }

    /**
     * Ensures WalletKit is initialized. If not already initialized, performs initialization
     * with the provided config or defaults. This is called automatically by all public methods
     * that require initialization, enabling auto-init behavior.
     *
     * @param config Configuration to use for initialization if not already initialized
     */
    private suspend fun ensureWalletKitInitialized(config: WalletKitBridgeConfig = WalletKitBridgeConfig()) {
        // Fast path: already initialized
        if (isWalletKitInitialized) {
            return
        }

        walletKitInitMutex.withLock {
            // Double-check after acquiring lock
            if (isWalletKitInitialized) {
                return@withLock
            }

            Log.d(logTag, ERROR_AUTO_INITIALIZING_WALLETKIT + config.network)

            // Use pending config if init was called explicitly, otherwise use provided config
            val effectiveConfig = pendingInitConfig ?: config
            pendingInitConfig = null

            try {
                performInitialization(effectiveConfig)
                isWalletKitInitialized = true
                Log.d(logTag, ERROR_WALLETKIT_AUTO_INIT_SUCCESS)
            } catch (err: Throwable) {
                Log.e(logTag, ERROR_WALLETKIT_AUTO_INIT_FAILED, err)
                throw WalletKitBridgeException(
                    ERROR_FAILED_AUTO_INIT_WALLETKIT + err.message,
                )
            }
        }
    }

    /**
     * Performs the actual initialization by calling the JavaScript init method.
     */
    private suspend fun performInitialization(config: WalletKitBridgeConfig) {
        currentNetwork = config.network
        persistentStorageEnabled = config.enablePersistentStorage

        // Only use explicitly provided URLs; JS side handles defaults based on network
        val tonClientEndpoint = config.tonClientEndpoint?.ifBlank { null }
            ?: config.apiUrl?.ifBlank { null }
        apiBaseUrl = config.tonApiUrl?.ifBlank { null } ?: ""
        tonApiKey = config.apiKey

        // Get app version from PackageManager
        val appVersion = config.appVersion ?: try {
            val packageInfo = appContext.packageManager.getPackageInfo(appContext.packageName, 0)
            packageInfo.versionName ?: NetworkConstants.DEFAULT_APP_VERSION
        } catch (e: Exception) {
            Log.w(logTag, ERROR_FAILED_GET_APP_VERSION, e)
            NetworkConstants.DEFAULT_APP_VERSION
        }

        // Get app name from config or use application label
        val appName = config.appName ?: try {
            val applicationInfo = appContext.applicationInfo
            val stringId = applicationInfo.labelRes
            if (stringId == 0) {
                applicationInfo.nonLocalizedLabel?.toString() ?: appContext.packageName
            } else {
                appContext.getString(stringId)
            }
        } catch (e: Exception) {
            Log.w(logTag, ERROR_FAILED_GET_APP_NAME, e)
            appContext.packageName
        }

        val payload =
            JSONObject().apply {
                put(JsonConstants.KEY_NETWORK, config.network)
                // Only include URLs if explicitly provided; JS will use defaults otherwise
                tonClientEndpoint?.let { put(JsonConstants.KEY_API_URL, it) }
                config.tonApiUrl?.let { put(JsonConstants.KEY_TON_API_URL, it) }
                config.bridgeUrl?.let { put(JsonConstants.KEY_BRIDGE_URL, it) }
                config.bridgeName?.let { put(JsonConstants.KEY_BRIDGE_NAME, it) }

                // Add walletManifest so dApp can recognize the wallet
                put(
                    JsonConstants.KEY_WALLET_MANIFEST,
                    JSONObject().apply {
                        put(JsonConstants.KEY_NAME, appName)
                        put(JsonConstants.KEY_APP_NAME, appName)
                        put(JsonConstants.KEY_IMAGE_URL, config.walletImageUrl ?: NetworkConstants.DEFAULT_WALLET_IMAGE_URL)
                        put(JsonConstants.KEY_ABOUT_URL, config.walletAboutUrl ?: NetworkConstants.DEFAULT_WALLET_ABOUT_URL)
                        config.walletUniversalUrl?.let { put(JsonConstants.KEY_UNIVERSAL_URL, it) }
                        put(
                            JsonConstants.KEY_PLATFORMS,
                            JSONArray().apply {
                                put(WebViewConstants.PLATFORM_ANDROID)
                            },
                        )
                    },
                )

                // Add deviceInfo with SendTransaction and SignData features
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
                                // Add SendTransaction feature (detailed form matching iOS)
                                put(
                                    JSONObject().apply {
                                        put(JsonConstants.KEY_NAME, JsonConstants.FEATURE_SEND_TRANSACTION)
                                        put(JsonConstants.KEY_MAX_MESSAGES, config.maxMessages)
                                    },
                                )
                                // Add SignData feature with supported types
                                put(
                                    JSONObject().apply {
                                        put(JsonConstants.KEY_NAME, JsonConstants.FEATURE_SIGN_DATA)
                                        put(JsonConstants.KEY_TYPES, JSONArray(config.signDataTypes))
                                    },
                                )
                            },
                        )
                    },
                )

                // Note: Persistent storage is controlled by enablePersistentStorage flag
                // When disabled, storage operations return immediately without persisting
            }

        Log.d(logTag, ERROR_INITIALIZING_WALLETKIT + persistentStorageEnabled + ", app: " + appName + " v" + appVersion)
        call(BridgeMethodConstants.METHOD_INIT, payload)
    }

    override suspend fun init(config: WalletKitBridgeConfig) {
        // Store config for use during auto-init if this is called before any other method
        walletKitInitMutex.withLock {
            if (!isWalletKitInitialized) {
                pendingInitConfig = config
            }
        }

        // Ensure initialization happens with this config
        ensureWalletKitInitialized(config)
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
        Log.d(logTag, ERROR_REMOVE_WALLET_RESULT + result)

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
                    Log.d(logTag, ERROR_SKIPPING_JETTON_TRANSACTION + txJson.optString(ResponseConstants.KEY_HASH_HEX, ResponseConstants.VALUE_UNKNOWN))
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
                    else -> "0"
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

        Log.d(logTag, ERROR_APPROVE_SIGN_DATA_RAW_RESULT + result)

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

    private suspend fun call(
        method: String,
        params: JSONObject? = null,
    ): JSONObject {
        ready.await()
        val callId = UUID.randomUUID().toString()
        val deferred = CompletableDeferred<BridgeResponse>()
        pending[callId] = deferred

        val payload = params?.toString()
        val idLiteral = JSONObject.quote(callId)
        val methodLiteral = JSONObject.quote(method)
        val script =
            if (payload == null) {
                WebViewConstants.JS_FUNCTION_WALLETKIT_CALL + "(" + idLiteral + "," + methodLiteral + "," + WebViewConstants.JS_NULL + ")"
            } else {
                val payloadBase64 = Base64.encodeToString(payload.toByteArray(Charsets.UTF_8), Base64.NO_WRAP)
                val payloadLiteral = JSONObject.quote(payloadBase64)
                WebViewConstants.JS_FUNCTION_WALLETKIT_CALL + "(" + idLiteral + "," + methodLiteral + ", " + WebViewConstants.JS_FUNCTION_ATOB + "(" + payloadLiteral + "))"
            }

        withContext(Dispatchers.Main) {
            webView.evaluateJavascript(script, null)
        }

        val response = deferred.await()
        Log.d(logTag, ERROR_CALL_COMPLETED + method + ERROR_COMPLETED_SUFFIX)
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
            Log.e(logTag, ERROR_CALL_FAILED + id + ERROR_FAILED_SUFFIX + message)
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
        Log.d(logTag, ERROR_EVENT_PREFIX + type + ERROR_BRACKET_SUFFIX)

        // Typed event handlers (sealed class)
        val typedEvent = parseTypedEvent(type, data, event)
        if (typedEvent != null) {
            eventHandlers.forEach { handler ->
                mainHandler.post { handler.handleEvent(typedEvent) }
            }
        }
    }

    private fun parseTypedEvent(type: String, data: JSONObject, raw: JSONObject): WalletKitEvent? {
        return when (type) {
            EventTypeConstants.EVENT_CONNECT_REQUEST -> {
                try {
                    // Deserialize JSON into typed event
                    val event = json.decodeFromString<ConnectRequestEvent>(data.toString())
                    val requestId = event.id
                    val dAppInfo = parseDAppInfo(data) // Keep existing parser for now
                    val permissions = event.preview?.permissions ?: emptyList()
                    val request = ConnectRequest(
                        requestId = requestId,
                        dAppInfo = dAppInfo,
                        permissions = permissions,
                        event = event,
                        engine = this,
                    )
                    WalletKitEvent.ConnectRequestEvent(request)
                } catch (e: Exception) {
                    Log.e(logTag, ERROR_FAILED_PARSE_CONNECT_REQUEST, e)
                    null
                }
            }

            EventTypeConstants.EVENT_TRANSACTION_REQUEST -> {
                try {
                    // Deserialize JSON into typed event
                    val event = json.decodeFromString<TransactionRequestEvent>(data.toString())
                    val requestId = event.id ?: return null
                    val dAppInfo = parseDAppInfo(data) // Keep existing parser for now
                    val txRequest = parseTransactionRequest(data) // Keep existing parser for now

                    // Extract preview data if available
                    val preview = data.optJSONObject(ResponseConstants.KEY_PREVIEW)?.toString()

                    val request = io.ton.walletkit.presentation.request.TransactionRequest(
                        requestId = requestId,
                        dAppInfo = dAppInfo,
                        request = txRequest,
                        preview = preview,
                        event = event,
                        engine = this,
                    )
                    WalletKitEvent.TransactionRequestEvent(request)
                } catch (e: Exception) {
                    Log.e(logTag, ERROR_FAILED_PARSE_TRANSACTION_REQUEST, e)
                    null
                }
            }

            EventTypeConstants.EVENT_SIGN_DATA_REQUEST -> {
                try {
                    // Deserialize JSON into typed event
                    val event = json.decodeFromString<SignDataRequestEvent>(data.toString())
                    val requestId = event.id ?: return null
                    val dAppInfo = parseDAppInfo(data) // Keep existing parser for now
                    val signRequest = parseSignDataRequest(data) // Keep existing parser for now
                    val request = io.ton.walletkit.presentation.request.SignDataRequest(
                        requestId = requestId,
                        dAppInfo = dAppInfo,
                        request = signRequest,
                        event = event,
                        engine = this,
                    )
                    WalletKitEvent.SignDataRequestEvent(request)
                } catch (e: Exception) {
                    Log.e(logTag, ERROR_FAILED_PARSE_SIGN_DATA_REQUEST, e)
                    null
                }
            }

            EventTypeConstants.EVENT_DISCONNECT -> {
                val sessionId = data.optNullableString(ResponseConstants.KEY_SESSION_ID)
                    ?: data.optNullableString(JsonConstants.KEY_ID)
                    ?: return null
                WalletKitEvent.DisconnectEvent(sessionId)
            }

            EventTypeConstants.EVENT_STATE_CHANGED, EventTypeConstants.EVENT_WALLET_STATE_CHANGED -> {
                val address = data.optNullableString(ResponseConstants.KEY_ADDRESS)
                    ?: data.optJSONObject(ResponseConstants.KEY_WALLET)?.optNullableString(ResponseConstants.KEY_ADDRESS)
                    ?: return null
                WalletKitEvent.StateChangedEvent(address)
            }

            EventTypeConstants.EVENT_SESSIONS_CHANGED -> {
                WalletKitEvent.SessionsChangedEvent
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
            ?: ""

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
        // Check if data is nested under "request" field
        val requestData = data.optJSONObject(ResponseConstants.KEY_REQUEST) ?: data

        // Try to parse from messages array first (TON Connect format)
        val messages = requestData.optJSONArray(ResponseConstants.KEY_MESSAGES)
        if (messages != null && messages.length() > 0) {
            val firstMessage = messages.optJSONObject(0)
            if (firstMessage != null) {
                return TransactionRequest(
                    recipient = firstMessage.optNullableString(ResponseConstants.KEY_ADDRESS)
                        ?: firstMessage.optNullableString(ResponseConstants.KEY_TO)
                        ?: "",
                    amount = firstMessage.optNullableString(ResponseConstants.KEY_AMOUNT)
                        ?: firstMessage.optNullableString(ResponseConstants.KEY_VALUE)
                        ?: "0",
                    comment = firstMessage.optNullableString(ResponseConstants.KEY_COMMENT)
                        ?: firstMessage.optNullableString(ResponseConstants.KEY_TEXT),
                    payload = firstMessage.optNullableString(ResponseConstants.KEY_PAYLOAD),
                )
            }
        }

        // Fallback to direct fields (legacy format or direct send)
        return TransactionRequest(
            recipient = requestData.optNullableString(ResponseConstants.KEY_TO) ?: requestData.optNullableString(ResponseConstants.KEY_RECIPIENT) ?: "",
            amount = requestData.optNullableString(ResponseConstants.KEY_AMOUNT) ?: requestData.optNullableString(ResponseConstants.KEY_VALUE) ?: "0",
            comment = requestData.optNullableString(ResponseConstants.KEY_COMMENT) ?: requestData.optNullableString(ResponseConstants.KEY_TEXT),
            payload = requestData.optNullableString(ResponseConstants.KEY_PAYLOAD),
        )
    }

    private fun parseSignDataRequest(data: JSONObject): SignDataRequest {
        // Parse params array - params[0] contains stringified JSON with schema_crc and payload
        var payload = data.optNullableString(ResponseConstants.KEY_PAYLOAD) ?: data.optNullableString(ResponseConstants.KEY_DATA) ?: ""
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
                    Log.e(logTag, ERROR_FAILED_PARSE_SIGN_DATA_PARAMS, e)
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
        if (!ready.isCompleted) {
            Log.d(logTag, LogConstants.MSG_BRIDGE_READY)
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
                Log.e(logTag, LogConstants.MSG_MALFORMED_PAYLOAD, err)
                pending.values.forEach { deferred ->
                    if (!deferred.isCompleted) {
                        deferred.completeExceptionally(WalletKitBridgeException("${LogConstants.ERROR_MALFORMED_PAYLOAD_PREFIX}${err.message}"))
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
                Log.e(logTag, "${LogConstants.MSG_STORAGE_GET_FAILED}$key", e)
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
                Log.e(logTag, "${LogConstants.MSG_STORAGE_SET_FAILED}$key", e)
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
                Log.e(logTag, "${LogConstants.MSG_STORAGE_REMOVE_FAILED}$key", e)
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
                Log.e(logTag, LogConstants.MSG_STORAGE_CLEAR_FAILED, e)
            }
        }
    }

    override suspend fun injectSignDataRequest(requestData: JSONObject): JSONObject {
        ensureWalletKitInitialized()
        return call(BridgeMethodConstants.METHOD_INJECT_SIGN_DATA_REQUEST, requestData)
    }

    private data class BridgeResponse(
        val result: JSONObject,
    )

    companion object {
        // WebView and Initialization Errors
        const val ERROR_WEBVIEW_LOADING_ASSET = "WebView bridge loading asset: "
        const val ERROR_AUTO_INITIALIZING_WALLETKIT = "Auto-initializing WalletKit with config: network="
        const val ERROR_WALLETKIT_AUTO_INIT_SUCCESS = "WalletKit auto-initialization completed successfully"
        const val ERROR_WALLETKIT_AUTO_INIT_FAILED = "WalletKit auto-initialization failed"
        const val ERROR_FAILED_AUTO_INIT_WALLETKIT = "Failed to auto-initialize WalletKit: "
        const val ERROR_FAILED_GET_APP_VERSION = "Failed to get app version, using default"
        const val ERROR_FAILED_GET_APP_NAME = "Failed to get app name, using package name"
        const val ERROR_INITIALIZING_WALLETKIT = "Initializing WalletKit with persistent storage: "

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
    }
}

/** Legacy alias retained for callers that still reference the old class name. */
typealias WalletKitBridge = WebViewWalletKitEngine
