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
import io.ton.walletkit.data.storage.bridge.BridgeStorageAdapter
import io.ton.walletkit.data.storage.bridge.SecureBridgeStorageAdapter
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
import io.ton.walletkit.domain.model.WalletSigner
import io.ton.walletkit.domain.model.WalletState
import io.ton.walletkit.presentation.WalletKitBridgeException
import io.ton.walletkit.presentation.WalletKitEngine
import io.ton.walletkit.presentation.WalletKitEngineKind
import io.ton.walletkit.presentation.browser.getTonConnectInjector
import io.ton.walletkit.presentation.browser.internal.TonConnectInjector
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
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import kotlin.collections.get
import kotlin.collections.remove
import kotlin.text.clear

/**
 * WebView-backed WalletKit engine. Hosts the WalletKit bundle inside a hidden WebView and uses the
 * established JS bridge to communicate with the Kotlin layer.
 *
 * **Persistent Storage**: By default, this engine persists wallet and session data
 * using secure encrypted storage. Data is automatically restored on app restart.
 * Storage can be disabled via config for testing or privacy-focused use cases.
 *
 * **IMPORTANT**: This engine caches WebView instances per network (mainnet/testnet).
 * Multiple TONWalletKit instances with the same network configuration will share the same
 * underlying WebView to prevent JavaScript bridge conflicts. Each TONWalletKit instance
 * maintains its own event handlers. Different networks get separate WebView engines.
 *
 * @suppress This is an internal implementation class. Use [WalletKitEngineFactory.create] instead.
 */
internal class WebViewWalletKitEngine private constructor(
    context: Context,
    private val configuration: TONWalletKitConfiguration,
    eventsHandler: TONBridgeEventsHandler?,
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

    // Whether persistent storage is enabled (set during init)
    @Volatile private var persistentStorageEnabled: Boolean = true

    // Multiple event handlers support (like iOS)
    private val eventHandlers = mutableListOf<TONBridgeEventsHandler>()
    private val eventHandlersMutex = Mutex()

    init {
        // Add initial handler if provided
        if (eventsHandler != null) {
            eventHandlers.add(eventsHandler)
        }
    }

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

    @Volatile private var currentNetwork: String = NetworkConstants.DEFAULT_NETWORK

    @Volatile private var apiBaseUrl: String = NetworkConstants.DEFAULT_TESTNET_API_URL

    @Volatile private var tonApiKey: String? = null

    // Auto-initialization state
    @Volatile private var isWalletKitInitialized = false
    private val walletKitInitMutex = Mutex()
    private var pendingInitConfig: TONWalletKitConfiguration? = null

    // Event listeners state (set up on-demand when first needed)
    @Volatile private var areEventListenersSetUp = false
    private val eventListenersSetupMutex = Mutex()

    // Signer callbacks for external wallets
    private val signerCallbacks = ConcurrentHashMap<String, WalletSigner>()

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
            Log.d(TAG, "Initializing WebView on thread: ${Thread.currentThread().name}")
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
                        Log.d(TAG, "WebView page started loading: $url")
                    }

                    override fun onPageFinished(view: WebView?, url: String?) {
                        super.onPageFinished(view, url)
                        Log.d(TAG, "WebView page finished loading: $url")
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
                        Log.d(TAG, "WebView intercepting request: $url")
                        return assetLoader.shouldInterceptRequest(url)
                            ?: super.shouldInterceptRequest(view, request)
                    }
                }
            val safeAssetPath = assetPath.trimStart('/')
            val fullUrl = WebViewConstants.URL_PREFIX_HTTPS + WebViewConstants.ASSET_LOADER_DOMAIN + WebViewConstants.ASSET_LOADER_PATH + safeAssetPath
            Log.d(TAG, "Loading WebView URL: $fullUrl")
            webView.loadUrl(fullUrl)
            Log.d(TAG, "WebView initialization completed, webViewInitialized completing")
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

            Log.d(TAG, "Auto-initializing WalletKit with config: network=${resolveNetworkName(effectiveConfig)}")

            try {
                performInitialization(effectiveConfig)
                isWalletKitInitialized = true
                Log.d(TAG, "WalletKit auto-initialization completed successfully")
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
                append("Initializing WalletKit with persistent storage: ")
                append(persistentStorageEnabled)
                append(", app: ")
                append(appName)
                append(" v")
                append(appVersion)
            },
        )
        call(BridgeMethodConstants.METHOD_INIT, payload)

        // Event listeners are set up on-demand by the user (via SDK methods like handleTonConnectUrl).
        // Events arriving before listeners are registered will be stored in durable_events by TS core
        // and automatically replayed when listeners are eventually registered.
        Log.d(TAG, "WalletKit initialized. Event listeners will be set up on-demand.")
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

    /**
     * Ensures event listeners are set up in the JavaScript bridge. This is called on-demand
     * when an operation needs events (e.g., handleTonConnectUrl, addEventsHandler).
     *
     * CRITICAL: This waits for WalletKit initialization to complete before setting up listeners,
     * ensuring the JS bridge is ready and preventing race conditions.
     */
    private suspend fun ensureEventListenersSetUp() {
        Log.d(TAG, "🔵 ensureEventListenersSetUp() called, areEventListenersSetUp=$areEventListenersSetUp")

        // Fast path: already set up
        if (areEventListenersSetUp) {
            Log.d(TAG, "⚡ Event listeners already set up, skipping")
            return
        }

        Log.d(TAG, "🔵 Acquiring eventListenersSetupMutex...")
        eventListenersSetupMutex.withLock {
            Log.d(TAG, "🔵 eventListenersSetupMutex acquired")

            // Double-check after acquiring lock
            if (areEventListenersSetUp) {
                Log.d(TAG, "⚡ Event listeners already set up (double-check), skipping")
                return@withLock
            }

            try {
                Log.d(TAG, "🔵 Waiting for WalletKit initialization...")
                // CRITICAL: Wait for WalletKit initialization to complete before setting up event listeners
                // This ensures the JS bridge is ready and prevents race conditions
                ensureWalletKitInitialized()
                Log.d(TAG, "✅ WalletKit initialization complete")

                Log.d(TAG, "🔵 Calling JS setEventsListeners()...")
                // Call JavaScript setEventsListeners() to start forwarding events
                call(BridgeMethodConstants.METHOD_SET_EVENTS_LISTENERS, JSONObject())
                areEventListenersSetUp = true
                Log.d(TAG, "✅✅✅ Event listeners set up successfully! areEventListenersSetUp=true")
            } catch (err: Throwable) {
                Log.e(TAG, "❌ Failed to set up event listeners", err)
                throw WalletKitBridgeException(ERROR_FAILED_SET_UP_EVENT_LISTENERS + err.message)
            }
        }
        Log.d(TAG, "🔵 eventListenersSetupMutex released")
    }

    override suspend fun addWalletFromMnemonic(
        words: List<String>,
        name: String?,
        version: String,
        network: String?,
    ): WalletAccount {
        ensureWalletKitInitialized()

        // Call addWalletFromMnemonic on the bridge (which handles creating and adding the wallet)
        val normalizedVersion = version.lowercase()
        val params =
            JSONObject().apply {
                put(JsonConstants.KEY_WORDS, JSONArray(words))
                put(JsonConstants.KEY_VERSION, normalizedVersion)
                network?.let { put(JsonConstants.KEY_NETWORK, it) }
            }

        call(BridgeMethodConstants.METHOD_ADD_WALLET_FROM_MNEMONIC, params)

        // Get wallets to find the one we just added
        val walletsResult = call(BridgeMethodConstants.METHOD_GET_WALLETS)
        val items = walletsResult.optJSONArray(ResponseConstants.KEY_ITEMS) ?: JSONArray()

        // The last wallet should be the one we just added
        if (items.length() > 0) {
            val lastWallet = items.optJSONObject(items.length() - 1)
            if (lastWallet != null) {
                return WalletAccount(
                    address = lastWallet.optString(ResponseConstants.KEY_ADDRESS),
                    publicKey = lastWallet.optNullableString(ResponseConstants.KEY_PUBLIC_KEY),
                    name = lastWallet.optNullableString(JsonConstants.KEY_NAME) ?: name,
                    version = lastWallet.optString(JsonConstants.KEY_VERSION, version),
                    network = lastWallet.optString(JsonConstants.KEY_NETWORK, network ?: currentNetwork),
                    index = lastWallet.optInt(ResponseConstants.KEY_INDEX, 0),
                )
            }
        }

        throw WalletKitBridgeException(ERROR_NEW_WALLET_NOT_FOUND)
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

        // Generate unique signer ID
        val signerId = "signer_${System.currentTimeMillis()}_${(Math.random() * 1000000).toInt()}"

        // Store the signer for later use
        signerCallbacks[signerId] = signer

        // Call bridge to create wallet with signer
        val normalizedVersion = version.lowercase()
        val params =
            JSONObject().apply {
                put(ResponseConstants.KEY_PUBLIC_KEY, signer.publicKey)
                put(JsonConstants.KEY_VERSION, normalizedVersion)
                put(ResponseConstants.KEY_SIGNER_ID, signerId)
                network?.let { put(JsonConstants.KEY_NETWORK, it) }
            }

        call(BridgeMethodConstants.METHOD_ADD_WALLET_WITH_SIGNER, params)

        // Get wallets to find the one we just added
        val walletsResult = call(BridgeMethodConstants.METHOD_GET_WALLETS)
        val items = walletsResult.optJSONArray(ResponseConstants.KEY_ITEMS) ?: JSONArray()

        // The last wallet should be the one we just added
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
                    Log.d(TAG, "Skipping jetton/token transaction: ${txJson.optString(ResponseConstants.KEY_HASH_HEX, ResponseConstants.VALUE_UNKNOWN)}")
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

            // Parse the JSON string params (can be JSONObject or JSONArray)
            val params: Any? = when {
                paramsJson == null -> null
                paramsJson.trimStart().startsWith("[") -> JSONArray(paramsJson)
                paramsJson.trimStart().startsWith("{") -> JSONObject(paramsJson)
                else -> {
                    Log.w(TAG, "Unexpected params format: $paramsJson")
                    null
                }
            }

            // Build params for the bridge call
            val requestParams = JSONObject().apply {
                put(ResponseConstants.KEY_MESSAGE_ID, messageId)
                put(ResponseConstants.KEY_METHOD, method)
                if (params != null) {
                    put(ResponseConstants.KEY_PARAMS, params)
                }
                // Pass the dApp URL so JavaScript can extract the correct domain
                if (url != null) {
                    put(ResponseConstants.KEY_URL, url)
                }
            }

            // Call the bridge method just like all other methods
            Log.d(TAG, "🔵 Calling processInternalBrowserRequest via bridge...")
            val result = call(BridgeMethodConstants.METHOD_PROCESS_INTERNAL_BROWSER_REQUEST, requestParams)

            Log.d(TAG, "🟢 Bridge call returned, result: $result")
            Log.d(TAG, "🟢 Calling responseCallback with result...")

            // Call the response callback with the result
            responseCallback(result)

            Log.d(TAG, "✅ Internal browser request processed: $method, responseCallback invoked")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to process internal browser request", e)
            val errorResponse = JSONObject().apply {
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

    override suspend fun sendLocalTransaction(
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
        call(BridgeMethodConstants.METHOD_SEND_LOCAL_TRANSACTION, params)
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

        Log.d(TAG, "approveSignData raw result: $result")

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

    override suspend fun callBridgeMethod(method: String, params: JSONObject?): JSONObject {
        return call(method, params)
    }

    override suspend fun addEventsHandler(eventsHandler: TONBridgeEventsHandler) {
        Log.w(TAG, "🔵🔵🔵 addEventsHandler() called!")
        Log.w(TAG, "🔵 Handler class: ${eventsHandler.javaClass.name}")
        Log.w(TAG, "🔵 Handler identity: ${System.identityHashCode(eventsHandler)}")
        Log.w(TAG, "🔵 Current handlers count: ${eventHandlers.size}")
        Log.w(TAG, "🔵 Current areEventListenersSetUp: $areEventListenersSetUp")

        val shouldSetupListeners = eventHandlersMutex.withLock {
            Log.d(TAG, "🔵 eventHandlersMutex acquired in addEventsHandler")

            // Log all existing handlers
            eventHandlers.forEachIndexed { index, handler ->
                Log.d(TAG, "🔵 Existing handler[$index]: ${handler.javaClass.name} (identity: ${System.identityHashCode(handler)})")
            }

            if (eventHandlers.contains(eventsHandler)) {
                Log.w(TAG, "⚠️⚠️⚠️ Handler already registered (found via .contains()), skipping!")
                return@withLock false
            }

            val isFirstHandler = eventHandlers.isEmpty()
            eventHandlers.add(eventsHandler)
            Log.w(TAG, "✅✅✅ Added event handler! Total handlers: ${eventHandlers.size}, isFirstHandler=$isFirstHandler")

            // Return whether we need to set up listeners (only for first handler)
            isFirstHandler
        }

        Log.w(TAG, "🔵 eventHandlersMutex released, shouldSetupListeners=$shouldSetupListeners")

        // CRITICAL: Set up event listeners AFTER releasing the mutex to avoid deadlock
        // Events arriving during setup need to acquire the mutex to access handlers list
        if (shouldSetupListeners) {
            Log.w(TAG, "🔵🔵🔵 First handler registered, setting up event listeners...")
            ensureEventListenersSetUp()
            Log.w(TAG, "✅✅✅ Event listener setup complete after first handler registration")
        } else {
            Log.w(TAG, "⚡⚡⚡ Not first handler, event listeners should already be set up (areEventListenersSetUp=$areEventListenersSetUp)")
        }
    }

    override suspend fun removeEventsHandler(eventsHandler: TONBridgeEventsHandler) {
        eventHandlersMutex.withLock {
            if (eventHandlers.remove(eventsHandler)) {
                Log.d(TAG, "Removed event handler: ${eventsHandler.javaClass.simpleName}. Total handlers: ${eventHandlers.size}")

                // Remove event listeners from JS bridge when last handler is removed (matches iOS)
                if (eventHandlers.isEmpty() && areEventListenersSetUp) {
                    try {
                        call(BridgeMethodConstants.METHOD_REMOVE_EVENT_LISTENERS, JSONObject())
                        areEventListenersSetUp = false
                        Log.d(TAG, "Event listeners removed from JS bridge (no handlers remaining)")
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed to remove event listeners from JS bridge", e)
                    }
                }
            }
        }
    }

    override suspend fun destroy() {
        withContext(Dispatchers.Main) {
            // Remove event listeners before destroying
            try {
                if (isWalletKitInitialized) {
                    Log.d(TAG, "Removing event listeners before destroy...")
                    call(BridgeMethodConstants.METHOD_REMOVE_EVENT_LISTENERS, JSONObject())
                }
            } catch (e: Exception) {
                Log.w(TAG, "Failed to remove event listeners during destroy", e)
            }

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
        Log.d(TAG, "call[$method] completed")
        return response.result
    }

    private fun handleResponse(
        id: String,
        response: JSONObject,
    ) {
        Log.d(TAG, "🟡 handleResponse called for id: $id")
        Log.d(TAG, "🟡 response: $response")
        Log.d(TAG, "🟡 pending.size before remove: ${pending.size}")
        val deferred = pending.remove(id)
        if (deferred == null) {
            Log.w(TAG, "⚠️ handleResponse: No deferred found for id: $id")
            Log.w(TAG, "⚠️ pending keys: ${pending.keys}")
            return
        }
        Log.d(TAG, "✅ Found deferred for id: $id")
        val error = response.optJSONObject(ResponseConstants.KEY_ERROR)
        if (error != null) {
            val message = error.optString(ResponseConstants.KEY_MESSAGE, ResponseConstants.ERROR_MESSAGE_DEFAULT)
            Log.e(TAG, ERROR_CALL_FAILED + id + ERROR_FAILED_SUFFIX + message)
            deferred.completeExceptionally(WalletKitBridgeException(message))
            return
        }
        val result = response.opt(ResponseConstants.KEY_RESULT)
        Log.d(TAG, "🟡 result type: ${result?.javaClass?.simpleName}")
        Log.d(TAG, "🟡 result: $result")
        val payload =
            when (result) {
                is JSONObject -> result
                is JSONArray -> JSONObject().put(ResponseConstants.KEY_ITEMS, result)
                null -> JSONObject()
                else -> JSONObject().put(ResponseConstants.KEY_VALUE, result)
            }
        Log.d(TAG, "✅ Completing deferred with payload: $payload")
        deferred.complete(BridgeResponse(payload))
        Log.d(TAG, "✅ Deferred completed for id: $id")
    }

    private fun handleEvent(event: JSONObject) {
        val type = event.optString(JsonConstants.KEY_TYPE, EventTypeConstants.EVENT_TYPE_UNKNOWN)
        val data = event.optJSONObject(ResponseConstants.KEY_DATA) ?: JSONObject()
        val eventId = event.optString(JsonConstants.KEY_ID, UUID.randomUUID().toString())

        Log.d(TAG, "🟢🟢🟢 === handleEvent called ===")
        Log.d(TAG, "🟢 Event type: $type")
        Log.d(TAG, "🟢 Event ID: $eventId")
        Log.d(TAG, "🟢 Event data keys: ${data.keys().asSequence().toList()}")
        Log.d(TAG, "🟢 Thread: ${Thread.currentThread().name}")

        // Typed event handlers (sealed class)
        val typedEvent = parseTypedEvent(type, data, event)
        Log.d(TAG, "🟢 Parsed typed event: ${(typedEvent?.javaClass?.simpleName ?: ResponseConstants.VALUE_UNKNOWN)}")

        if (typedEvent != null) {
            Log.d(TAG, "🟢 Typed event is NOT null, posting to main handler...")

            mainHandler.post {
                Log.d(TAG, "🟢 Main handler runnable executing for event $type")
                try {
                    // Notify all registered handlers - synchronous access safe here since we're on main thread
                    Log.d(TAG, "🟢 Acquiring eventHandlersMutex to get handlers list...")
                    val handlers = runBlocking {
                        eventHandlersMutex.withLock {
                            Log.d(TAG, "🟢 eventHandlersMutex acquired, eventHandlers.size=${eventHandlers.size}")
                            eventHandlers.toList() // Create a copy to avoid ConcurrentModificationException
                        }
                    }

                    Log.d(TAG, "🟢 Got ${handlers.size} handlers, notifying each...")
                    for (handler in handlers) {
                        try {
                            Log.d(TAG, "🟢 Calling handler.handle() for ${handler.javaClass.simpleName}")
                            handler.handle(typedEvent)
                            Log.d(TAG, "✅ Handler ${handler.javaClass.simpleName} processed event successfully")
                        } catch (e: Exception) {
                            Log.e(TAG, "❌ " + MSG_HANDLER_EXCEPTION_PREFIX + eventId + " for handler ${handler.javaClass.simpleName}", e)
                        }
                    }
                    Log.d(TAG, "✅ All handlers notified for event $type")
                } catch (e: Exception) {
                    Log.e(TAG, "❌ " + MSG_HANDLER_EXCEPTION_PREFIX + eventId, e)
                }
            }
        } else {
            Log.w(TAG, "⚠️ " + MSG_FAILED_PARSE_TYPED_EVENT_PREFIX + type + " - event will be ignored")
        }
    }

    private fun handleJsBridgeEvent(payload: JSONObject) {
        val sessionId = payload.optString("sessionId")
        val event = payload.optJSONObject("event")

        Log.d(TAG, "📤 handleJsBridgeEvent called")
        Log.d(TAG, "📤 sessionId: $sessionId")
        Log.d(TAG, "📤 event: $event")
        Log.d(TAG, "📤 Full payload: $payload")

        if (event == null) {
            Log.e(TAG, "❌ No event object in ${ResponseConstants.VALUE_KIND_JS_BRIDGE_EVENT} payload")
            return
        }

        mainHandler.post {
            try {
                // Look up the WebView for this session using the sessionId
                Log.d(TAG, "📤 Looking up WebView for session: $sessionId")
                val targetWebView = TonConnectInjector.getWebViewForSession(sessionId)

                if (targetWebView != null) {
                    Log.d(TAG, "✅ Found WebView for session: $sessionId")
                    // Get the injector from the WebView and send the event
                    val injector = targetWebView.getTonConnectInjector()
                    if (injector != null) {
                        Log.d(TAG, "✅ Found TonConnectInjector, sending event to WebView")
                        Log.d(TAG, "📤 Event being sent: $event")
                        injector.sendEvent(event)
                        Log.d(TAG, "✅ Event sent successfully")
                    } else {
                        Log.w(TAG, "⚠️  WebView found but no TonConnectInjector attached for session: $sessionId")
                    }
                } else {
                    // No WebView found for this session - may have been destroyed or never registered
                    Log.w(TAG, "⚠️  No WebView found for session: $sessionId (browser may have been closed)")
                    Log.w(TAG, "⚠️  This means the WebView was never registered or was garbage collected")
                }
            } catch (e: Exception) {
                Log.e(TAG, "❌ Failed to send JS Bridge event", e)
            }
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
                // Debug: log disconnect sessionId and available keys
                Log.d(TAG, "Disconnect event received. sessionId=$sessionId, dataKeys=${data.keys().asSequence().toList()}")
                TONWalletKitEvent.Disconnect(
                    io.ton.walletkit.presentation.event.DisconnectEvent(sessionId),
                )
            }

            // Browser events from WebView extension
            EventTypeConstants.EVENT_BROWSER_PAGE_STARTED -> {
                val url = data.optString("url", "")
                TONWalletKitEvent.BrowserPageStarted(url)
            }

            EventTypeConstants.EVENT_BROWSER_PAGE_FINISHED -> {
                val url = data.optString("url", "")
                TONWalletKitEvent.BrowserPageFinished(url)
            }

            EventTypeConstants.EVENT_BROWSER_ERROR -> {
                val message = data.optString("message", "Unknown error")
                TONWalletKitEvent.BrowserError(message)
            }

            EventTypeConstants.EVENT_BROWSER_BRIDGE_REQUEST -> {
                val messageId = data.optString("messageId", "")
                val method = data.optString("method", "")
                val request = data.optString("request", "")
                TONWalletKitEvent.BrowserBridgeRequest(messageId, method, request)
            }

            EventTypeConstants.EVENT_SIGNER_SIGN_REQUEST -> {
                // Handle sign request from external signer wallet
                val signerId = data.optString(ResponseConstants.KEY_SIGNER_ID)
                val requestId = data.optString(ResponseConstants.KEY_REQUEST_ID)
                val dataArray = data.optJSONArray(ResponseConstants.KEY_DATA)

                if (signerId.isNotEmpty() && requestId.isNotEmpty() && dataArray != null) {
                    val signer = signerCallbacks[signerId]
                    if (signer != null) {
                        // Convert JSON array to ByteArray
                        val dataBytes = ByteArray(dataArray.length()) { i -> dataArray.optInt(i).toByte() }

                        // Launch coroutine to call signer and respond
                        CoroutineScope(Dispatchers.IO).launch {
                            try {
                                val signature = signer.sign(dataBytes)
                                respondToSignRequest(signerId, requestId, signature, null)
                            } catch (e: Exception) {
                                Log.e(TAG, "Signer failed to sign data", e)
                                respondToSignRequest(signerId, requestId, null, e.message ?: "Signing failed")
                            }
                        }
                    } else {
                        Log.w(TAG, "Unknown signer ID: $signerId")
                    }
                }
                null // Don't emit to event handler, this is internal
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
        Log.d(TAG, "🚀 handleReady() called")

        payload.optNullableString(ResponseConstants.KEY_NETWORK)?.let { currentNetwork = it }
        payload.optNullableString(ResponseConstants.KEY_TON_API_URL)?.let { apiBaseUrl = it }
        if (!bridgeLoaded.isCompleted) {
            bridgeLoaded.complete(Unit)
            Log.d(TAG, "🚀 bridgeLoaded completed")
        }
        markJsBridgeReady()

        val wasAlreadyReady = ready.isCompleted
        Log.d(TAG, "🚀 wasAlreadyReady=$wasAlreadyReady, ready.isCompleted=${ready.isCompleted}")

        if (!ready.isCompleted) {
            Log.d(TAG, "🚀 Completing ready for the first time")
            ready.complete(Unit)
        }

        // CRITICAL: If the bridge is becoming ready AGAIN (page reload, WebView context lost),
        // and we had event listeners set up before, we need to re-setup them in the new JS context
        if (wasAlreadyReady && areEventListenersSetUp) {
            Log.w(TAG, "⚠️⚠️⚠️ Bridge ready event received again - JavaScript context was lost! Re-setting up event listeners...")
            // Reset the flag so ensureEventListenersSetUp will actually re-run
            areEventListenersSetUp = false
            // Re-setup event listeners in the new JS context (this will trigger replay of stored events)
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    Log.d(TAG, "🔵 Re-setting up event listeners after JS context loss...")
                    ensureEventListenersSetUp()
                    Log.d(TAG, "✅ Event listeners re-established after JS context loss")
                } catch (e: Exception) {
                    Log.e(TAG, "❌ Failed to re-setup event listeners after JS context loss", e)
                }
            }
        } else {
            Log.d(TAG, "🚀 Normal ready event (wasAlreadyReady=$wasAlreadyReady, areEventListenersSetUp=$areEventListenersSetUp)")
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
        Log.d(TAG, "🚀 Calling handleEvent for ready event")
        handleEvent(readyEvent)
        Log.d(TAG, "🚀 handleReady() complete")
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
                // Log raw JSON received from JS for debugging
                Log.d(TAG, "📨 JsBinding.postMessage received from JS")
                Log.d(TAG, "📨 Thread: ${Thread.currentThread().name}")
                Log.v(TAG, "📨 Raw JSON: $json")

                val payload = JSONObject(json)
                val kind = payload.optString(ResponseConstants.KEY_KIND)
                Log.d(TAG, "📨 Message kind: $kind")

                when (kind) {
                    ResponseConstants.VALUE_KIND_READY -> {
                        Log.d(TAG, "📨 Handling READY event")
                        handleReady(payload)
                    }
                    ResponseConstants.VALUE_KIND_EVENT -> {
                        Log.d(TAG, "📨 Handling EVENT")
                        payload.optJSONObject(ResponseConstants.KEY_EVENT)?.let {
                            handleEvent(it)
                        } ?: Log.w(TAG, "⚠️ EVENT kind but no event object in payload")
                    }
                    ResponseConstants.VALUE_KIND_RESPONSE -> {
                        Log.d(TAG, "📨 Handling RESPONSE")
                        handleResponse(payload.optString(ResponseConstants.KEY_ID), payload)
                    }
                    ResponseConstants.VALUE_KIND_JS_BRIDGE_EVENT -> {
                        Log.d(TAG, "📨 Handling JS_BRIDGE_EVENT")
                        handleJsBridgeEvent(payload)
                    }
                    else -> {
                        Log.w(TAG, "⚠️ Unknown message kind: $kind")
                    }
                }
            } catch (err: JSONException) {
                Log.e(TAG, "❌ " + LogConstants.MSG_MALFORMED_PAYLOAD, err)
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
                Log.d(TAG, "storageGet called with key=$key")
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
                Log.d(TAG, "storageSet called with key=$key, valueLength=${value.length}")
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
                Log.d(TAG, "storageRemove called with key=$key")
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

    private data class BridgeResponse(
        val result: JSONObject,
    )

    companion object {
        // Cache of WebView engines keyed by network
        // Multiple configs with same network share the same WebView engine
        private val instances = mutableMapOf<TONNetwork, WebViewWalletKitEngine>()
        private val instanceMutex = Mutex()

        /**
         * Get or create a WebView engine instance for the given configuration.
         *
         * CRITICAL: WebView engines are cached per network to prevent JS bridge conflicts.
         * Multiple TONWalletKit instances with the same network will share the same underlying
         * WebView engine, each with their own event handlers.
         *
         * Different networks (mainnet vs testnet) get separate WebView engines since they
         * require different bridge configurations and API endpoints.
         */
        suspend fun getOrCreate(
            context: Context,
            configuration: TONWalletKitConfiguration,
            eventsHandler: TONBridgeEventsHandler?,
            assetPath: String = WebViewConstants.DEFAULT_ASSET_PATH,
        ): WebViewWalletKitEngine {
            val network = configuration.network

            // Fast path: instance already exists for this network
            instances[network]?.let { existingInstance ->
                Log.w(TAG, "♻️♻️♻️ Reusing existing WebView engine for network: $network")
                // Add the event handler OUTSIDE the lock to avoid blocking
                if (eventsHandler != null) {
                    existingInstance.addEventsHandler(eventsHandler)
                }
                return existingInstance
            }

            // Slow path: create new instance (with mutex)
            val newInstance = instanceMutex.withLock {
                // Double-check after acquiring lock
                instances[network]?.let {
                    Log.w(TAG, "♻️♻️♻️ Reusing existing WebView engine for network: $network (after lock)")
                    return@withLock it
                }

                Log.w(TAG, "🔶🔶🔶 Creating NEW WebView engine for network: $network")
                val instance = WebViewWalletKitEngine(context, configuration, eventsHandler, assetPath)
                instances[network] = instance
                instance
            }

            // If we got an existing instance from the double-check, add the handler outside the lock
            if (eventsHandler != null && !newInstance.eventHandlers.contains(eventsHandler)) {
                newInstance.addEventsHandler(eventsHandler)
            }

            return newInstance
        }

        /**
         * Clear cached instances (for testing or cleanup).
         * @param network If specified, clears only the instance for that network.
         *                If null, clears all instances.
         * @suppress Internal method for testing
         */
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
        private const val MSG_FAILED_INITIALIZE_WEBVIEW = "Failed to initialize WebView"
        private const val MSG_FAILED_EVALUATE_JS_BRIDGE = "Failed to evaluate JS bridge readiness"
        private const val MSG_HANDLER_EXCEPTION_PREFIX = "Handler threw exception for event "
        private const val MSG_FAILED_PARSE_TYPED_EVENT_PREFIX = "Failed to parse typed event for type: "
        private const val MSG_URL_SEPARATOR = " url="
        private const val MSG_OPEN_PAREN = " ("
        private const val MSG_CLOSE_PAREN_PERIOD_SPACE = "). "
        private const val JS_OPEN_PAREN = "("
        private const val JS_CLOSE_PAREN = ")"
        private const val JS_PARAMETER_SEPARATOR = ","

        // WebView and Initialization Errors
        const val ERROR_WALLETKIT_AUTO_INIT_FAILED = "WalletKit auto-initialization failed"
        const val ERROR_FAILED_AUTO_INIT_WALLETKIT = "Failed to auto-initialize WalletKit: "
        const val ERROR_FAILED_GET_APP_VERSION = "Failed to get app version, using default"
        const val ERROR_FAILED_GET_APP_NAME = "Failed to get app name, using package name"
        const val ERROR_INIT_CONFIG_REQUIRED = "TONWalletKit.initialize() must be called before using the SDK."

        // Wallet Operation Errors
        const val ERROR_FAILED_REMOVE_WALLET = "Failed to remove wallet: "
        const val ERROR_WALLET_ADDRESS_REQUIRED = "walletAddress is required for connect approval"

        // Transaction Errors
        // Sign Data Errors
        private const val ERROR_SIGNATURE_MISSING_SIGN_DATA_RESULT = "Signature missing from signDataWithMnemonic result"
        const val ERROR_NO_SIGNATURE_IN_RESPONSE = "No signature in approveSignData response: "

        // Event Parsing Errors
        const val ERROR_FAILED_PARSE_CONNECT_REQUEST = "Failed to parse ConnectRequestEvent"
        const val ERROR_FAILED_PARSE_TRANSACTION_REQUEST = "Failed to parse TransactionRequestEvent"
        const val ERROR_FAILED_PARSE_SIGN_DATA_REQUEST = "Failed to parse SignDataRequestEvent"
        const val ERROR_FAILED_PARSE_SIGN_DATA_PARAMS = "Failed to parse params for sign data"

        // Bridge Call Errors
        const val ERROR_CALL_FAILED = "call["
        const val ERROR_FAILED_SUFFIX = "] failed: "
        const val ERROR_FAILED_SET_UP_EVENT_LISTENERS = "Failed to set up event listeners: "
        const val ERROR_FAILED_PROCESS_REQUEST = "Failed to process request"

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
