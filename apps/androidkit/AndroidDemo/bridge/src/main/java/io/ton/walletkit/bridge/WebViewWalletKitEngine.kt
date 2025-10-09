package io.ton.walletkit.bridge

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Base64
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.webkit.WebViewAssetLoader
import io.ton.walletkit.bridge.config.WalletKitBridgeConfig
import io.ton.walletkit.bridge.listener.WalletKitEngineListener
import io.ton.walletkit.bridge.model.WalletAccount
import io.ton.walletkit.bridge.model.WalletKitEvent
import io.ton.walletkit.bridge.model.WalletSession
import io.ton.walletkit.bridge.model.WalletState
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
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
 */
class WebViewWalletKitEngine(
    context: Context,
    private val assetPath: String = "walletkit/index.html",
) : WalletKitEngine {
    override val kind: WalletKitEngineKind = WalletKitEngineKind.WEBVIEW

    private val logTag = "WebViewWalletKitEngine"
    private val appContext = context.applicationContext
    private val assetLoader =
        WebViewAssetLoader
            .Builder()
            .setDomain(ASSET_LOADER_DOMAIN)
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(appContext))
            .build()
    private val mainHandler = Handler(Looper.getMainLooper())
    private val webView: WebView = WebView(appContext)
    private val ready = CompletableDeferred<Unit>()
    private val pending = ConcurrentHashMap<String, CompletableDeferred<BridgeResponse>>()
    private val listeners = CopyOnWriteArraySet<WalletKitEngineListener>()

    @Volatile private var currentNetwork: String = "testnet"

    @Volatile private var apiBaseUrl: String = "https://testnet.tonapi.io"

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
            webView.addJavascriptInterface(JsBinding(), "WalletKitNative")
            webView.webViewClient =
                object : WebViewClient() {
                    override fun onReceivedError(
                        view: WebView?,
                        request: WebResourceRequest?,
                        error: WebResourceError?,
                    ) {
                        super.onReceivedError(view, request, error)
                        val description = error?.description?.toString() ?: "unknown"
                        val failingUrl = request?.url?.toString()
                        Log.e(logTag, "WebView load failed: $description url=$failingUrl")
                        if (request?.isForMainFrame == true && !ready.isCompleted) {
                            ready.completeExceptionally(
                                WalletKitBridgeException(
                                    "Failed to load WalletKit bundle ($description). Run `pnpm -w --filter androidkit build` and recompile.",
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
            webView.loadUrl("https://$ASSET_LOADER_DOMAIN/assets/$safeAssetPath")
            Log.d(logTag, "WebView bridge loading asset: $assetPath")
        }
    }

    /** Attach the WebView to a parent view so it can be inspected/debugged if needed. */
    fun attachTo(parent: android.view.ViewGroup) {
        if (webView.parent !== parent) {
            (webView.parent as? android.view.ViewGroup)?.removeView(webView)
            parent.addView(webView)
        }
    }

    fun asView(): WebView = webView

    override fun addListener(listener: WalletKitEngineListener): Closeable {
        listeners.add(listener)
        return Closeable { listeners.remove(listener) }
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

            Log.d(logTag, "Auto-initializing WalletKit with config: network=${config.network}")

            // Use pending config if init was called explicitly, otherwise use provided config
            val effectiveConfig = pendingInitConfig ?: config
            pendingInitConfig = null

            try {
                performInitialization(effectiveConfig)
                isWalletKitInitialized = true
                Log.d(logTag, "WalletKit auto-initialization completed successfully")
            } catch (err: Throwable) {
                Log.e(logTag, "WalletKit auto-initialization failed", err)
                throw WalletKitBridgeException(
                    "Failed to auto-initialize WalletKit: ${err.message}",
                )
            }
        }
    }

    /**
     * Performs the actual initialization by calling the JavaScript init method.
     */
    private suspend fun performInitialization(config: WalletKitBridgeConfig) {
        currentNetwork = config.network
        val tonClientEndpoint =
            config.tonClientEndpoint?.ifBlank { null }
                ?: config.apiUrl?.ifBlank { null }
                ?: defaultTonClientEndpoint(config.network)
        apiBaseUrl = config.tonApiUrl?.ifBlank { null }
            ?: defaultTonApiBase(config.network)
        tonApiKey = config.apiKey

        val payload =
            JSONObject().apply {
                put("network", config.network)
                put("apiUrl", tonClientEndpoint)
                config.apiUrl?.let { put("apiBaseUrl", config.apiUrl) }
                config.tonApiUrl?.let { put("tonApiUrl", config.tonApiUrl) }
                config.bridgeUrl?.let { put("bridgeUrl", it) }
                config.bridgeName?.let { put("bridgeName", it) }
                config.allowMemoryStorage?.let { put("allowMemoryStorage", it) }
            }

        call("init", payload)
    }

    override suspend fun init(config: WalletKitBridgeConfig): JSONObject {
        // Store config for use during auto-init if this is called before any other method
        walletKitInitMutex.withLock {
            if (!isWalletKitInitialized) {
                pendingInitConfig = config
            }
        }

        // Ensure initialization happens with this config
        ensureWalletKitInitialized(config)

        return JSONObject().apply { put("ok", true) }
    }

    private fun defaultTonClientEndpoint(network: String): String = if (network.equals("mainnet", ignoreCase = true)) {
        "https://toncenter.com/api/v2/jsonRPC"
    } else {
        "https://testnet.toncenter.com/api/v2/jsonRPC"
    }

    private fun defaultTonApiBase(network: String): String = if (network.equals("mainnet", ignoreCase = true)) {
        "https://tonapi.io"
    } else {
        "https://testnet.tonapi.io"
    }

    override suspend fun addWalletFromMnemonic(
        words: List<String>,
        version: String,
        network: String?,
    ): JSONObject {
        ensureWalletKitInitialized()
        val params =
            JSONObject().apply {
                put("words", JSONArray(words))
                put("version", version)
                network?.let { put("network", it) }
            }
        return call("addWalletFromMnemonic", params)
    }

    override suspend fun getWallets(): List<WalletAccount> {
        ensureWalletKitInitialized()
        val result = call("getWallets")
        val items = result.optJSONArray("items") ?: JSONArray()
        return buildList(items.length()) {
            for (index in 0 until items.length()) {
                val entry = items.optJSONObject(index) ?: continue
                add(
                    WalletAccount(
                        address = entry.optString("address"),
                        publicKey = entry.optNullableString("publicKey"),
                        version = entry.optString("version", "unknown"),
                        network = entry.optString("network", currentNetwork),
                        index = entry.optInt("index", index),
                    ),
                )
            }
        }
    }

    override suspend fun removeWallet(address: String): JSONObject {
        ensureWalletKitInitialized()
        val params = JSONObject().apply { put("address", address) }
        val result = call("removeWallet", params)
        Log.d(logTag, "removeWallet result: $result")
        return result
    }

    override suspend fun getWalletState(address: String): WalletState {
        ensureWalletKitInitialized()
        val params = JSONObject().apply { put("address", address) }
        val result = call("getWalletState", params)
        return WalletState(
            balance =
            when {
                result.has("balance") -> result.optString("balance")
                result.has("value") -> result.optString("value")
                else -> null
            },
            transactions = result.optJSONArray("transactions") ?: JSONArray(),
        )
    }

    override suspend fun getRecentTransactions(address: String, limit: Int): JSONArray {
        ensureWalletKitInitialized()
        val params = JSONObject().apply {
            put("address", address)
            put("limit", limit)
        }
        val result = call("getRecentTransactions", params)
        return result.optJSONArray("items") ?: JSONArray()
    }

    override suspend fun handleTonConnectUrl(url: String): JSONObject {
        ensureWalletKitInitialized()
        val params = JSONObject().apply { put("url", url) }
        return call("handleTonConnectUrl", params)
    }

    override suspend fun sendTransaction(
        walletAddress: String,
        recipient: String,
        amount: String,
        comment: String?,
    ): JSONObject {
        ensureWalletKitInitialized()
        val params =
            JSONObject().apply {
                put("walletAddress", walletAddress)
                put("toAddress", recipient)
                put("amount", amount)
                if (!comment.isNullOrBlank()) {
                    put("comment", comment)
                }
            }
        return call("sendTransaction", params)
    }

    override suspend fun approveConnect(
        requestId: Any,
        walletAddress: String,
    ): JSONObject {
        ensureWalletKitInitialized()
        val params =
            JSONObject().apply {
                put("requestId", requestId)
                put("walletAddress", walletAddress)
            }
        return call("approveConnectRequest", params)
    }

    override suspend fun rejectConnect(
        requestId: Any,
        reason: String?,
    ): JSONObject {
        ensureWalletKitInitialized()
        val params =
            JSONObject().apply {
                put("requestId", requestId)
                reason?.let { put("reason", it) }
            }
        return call("rejectConnectRequest", params)
    }

    override suspend fun approveTransaction(requestId: Any): JSONObject {
        ensureWalletKitInitialized()
        val params = JSONObject().apply { put("requestId", requestId) }
        return call("approveTransactionRequest", params)
    }

    override suspend fun rejectTransaction(
        requestId: Any,
        reason: String?,
    ): JSONObject {
        ensureWalletKitInitialized()
        val params =
            JSONObject().apply {
                put("requestId", requestId)
                reason?.let { put("reason", it) }
            }
        return call("rejectTransactionRequest", params)
    }

    override suspend fun approveSignData(requestId: Any): JSONObject {
        ensureWalletKitInitialized()
        val params = JSONObject().apply { put("requestId", requestId) }
        return call("approveSignDataRequest", params)
    }

    override suspend fun rejectSignData(
        requestId: Any,
        reason: String?,
    ): JSONObject {
        ensureWalletKitInitialized()
        val params =
            JSONObject().apply {
                put("requestId", requestId)
                reason?.let { put("reason", it) }
            }
        return call("rejectSignDataRequest", params)
    }

    override suspend fun listSessions(): List<WalletSession> {
        ensureWalletKitInitialized()
        val result = call("listSessions")
        val items = result.optJSONArray("items") ?: JSONArray()
        return buildList(items.length()) {
            for (index in 0 until items.length()) {
                val entry = items.optJSONObject(index) ?: continue
                add(
                    WalletSession(
                        sessionId = entry.optString("sessionId"),
                        dAppName = entry.optString("dAppName"),
                        walletAddress = entry.optString("walletAddress"),
                        dAppUrl = entry.optNullableString("dAppUrl"),
                        manifestUrl = entry.optNullableString("manifestUrl"),
                        iconUrl = entry.optNullableString("iconUrl"),
                        createdAtIso = entry.optNullableString("createdAt"),
                        lastActivityIso = entry.optNullableString("lastActivity"),
                    ),
                )
            }
        }
    }

    override suspend fun disconnectSession(sessionId: String?): JSONObject {
        ensureWalletKitInitialized()
        val params = JSONObject()
        sessionId?.let { params.put("sessionId", it) }
        return call("disconnectSession", if (params.length() == 0) null else params)
    }

    override suspend fun destroy() {
        withContext(Dispatchers.Main) {
            (webView.parent as? android.view.ViewGroup)?.removeView(webView)
            webView.removeJavascriptInterface("WalletKitNative")
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
                "window.__walletkitCall($idLiteral,$methodLiteral,null)"
            } else {
                val payloadBase64 = Base64.encodeToString(payload.toByteArray(Charsets.UTF_8), Base64.NO_WRAP)
                val payloadLiteral = JSONObject.quote(payloadBase64)
                "window.__walletkitCall($idLiteral,$methodLiteral, atob($payloadLiteral))"
            }

        withContext(Dispatchers.Main) {
            webView.evaluateJavascript(script, null)
        }

        val response = deferred.await()
        Log.d(logTag, "call[$method] completed")
        return response.result
    }

    private fun handleResponse(
        id: String,
        response: JSONObject,
    ) {
        val deferred = pending.remove(id) ?: return
        val error = response.optJSONObject("error")
        if (error != null) {
            val message = error.optString("message", "WalletKit bridge error")
            Log.e(logTag, "call[$id] failed: $message")
            deferred.completeExceptionally(WalletKitBridgeException(message))
            return
        }
        val result = response.opt("result")
        val payload =
            when (result) {
                is JSONObject -> result
                is JSONArray -> JSONObject().put("items", result)
                null -> JSONObject()
                else -> JSONObject().put("value", result)
            }
        deferred.complete(BridgeResponse(payload))
    }

    private fun handleEvent(event: JSONObject) {
        val type = event.optString("type", "unknown")
        val data = event.optJSONObject("data") ?: JSONObject()
        Log.d(logTag, "event[$type]")
        val walletEvent = WalletKitEvent(type, data, event)
        listeners.forEach { listener ->
            mainHandler.post { listener.onEvent(walletEvent) }
        }
    }

    private fun handleReady(payload: JSONObject) {
        payload.optNullableString("network")?.let { currentNetwork = it }
        payload.optNullableString("tonApiUrl")?.let { apiBaseUrl = it }
        if (!ready.isCompleted) {
            Log.d(logTag, "bridge ready")
            ready.complete(Unit)
        }
        val data = JSONObject()
        val keys = payload.keys()
        while (keys.hasNext()) {
            val key = keys.next()
            if (key == "kind") continue
            if (payload.isNull(key)) {
                data.put(key, JSONObject.NULL)
            } else {
                data.put(key, payload.get(key))
            }
        }
        val readyEvent = JSONObject().apply {
            put("type", "ready")
            put("data", data)
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
                when (payload.optString("kind")) {
                    "ready" -> handleReady(payload)
                    "event" -> payload.optJSONObject("event")?.let { handleEvent(it) }
                    "response" -> handleResponse(payload.optString("id"), payload)
                }
            } catch (err: JSONException) {
                Log.e(logTag, "Malformed payload from JS", err)
                pending.values.forEach { deferred ->
                    if (!deferred.isCompleted) {
                        deferred.completeExceptionally(WalletKitBridgeException("Malformed payload: ${err.message}"))
                    }
                }
            }
        }
    }

    override suspend fun injectSignDataRequest(requestData: JSONObject): JSONObject {
        ensureWalletKitInitialized()
        return call("injectSignDataRequest", requestData)
    }

    private data class BridgeResponse(
        val result: JSONObject,
    )

    private companion object {
        private const val ASSET_LOADER_DOMAIN = "appassets.androidplatform.net"
    }
}

/** Legacy alias retained for callers that still reference the old class name. */
typealias WalletKitBridge = WebViewWalletKitEngine
