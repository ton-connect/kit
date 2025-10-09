package io.ton.walletkit.bridge

import android.content.Context
import android.util.Base64
import android.util.Log
import io.ton.walletkit.bridge.config.WalletKitBridgeConfig
import io.ton.walletkit.bridge.listener.WalletKitEngineListener
import io.ton.walletkit.bridge.model.WalletAccount
import io.ton.walletkit.bridge.model.WalletKitEvent
import io.ton.walletkit.bridge.model.WalletSession
import io.ton.walletkit.bridge.model.WalletState
import io.ton.walletkit.quickjs.QuickJs
import kotlinx.coroutines.CancellableContinuation
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.asCoroutineDispatcher
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import okhttp3.Call
import okhttp3.Headers
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import okio.BufferedSource
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.io.Closeable
import java.io.IOException
import java.nio.charset.StandardCharsets
import java.security.SecureRandom
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArraySet
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.ScheduledThreadPoolExecutor
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.jvm.java

/**
 * QuickJS-backed implementation of [WalletKitEngine]. Executes the WalletKit JavaScript bundle
 * inside the embedded QuickJS runtime and bridges JSON-RPC calls/events to Kotlin.
 *
 * @deprecated QuickJS engine is deprecated as of October 2025 due to poor performance (2x slower than WebView).
 * Use [WebViewWalletKitEngine] instead. This implementation is preserved for reference and potential
 * future optimization experiments only. See QUICKJS_DEPRECATION.md for details.
 *
 * Performance comparison (cold start):
 * - QuickJS: 1881ms average (slower crypto operations)
 * - WebView: 917ms average (2x faster)
 *
 * Migration: Replace `QuickJsWalletKitEngine(context)` with `WebViewWalletKitEngine(context)`.
 */
@Deprecated(
    message = "QuickJS is 2x slower than WebView and is no longer maintained. Use WebViewWalletKitEngine instead.",
    replaceWith = ReplaceWith(
        "WebViewWalletKitEngine(context, assetPath, httpClient)",
        "io.ton.walletkit.bridge.WebViewWalletKitEngine",
    ),
    level = DeprecationLevel.WARNING,
)
class QuickJsWalletKitEngine(
    context: Context,
    private val assetPath: String = DEFAULT_BUNDLE_ASSET,
    private val httpClient: OkHttpClient = defaultHttpClient(),
) : WalletKitEngine {
    override val kind: WalletKitEngineKind = WalletKitEngineKind.QUICKJS

    internal val logTag = "QuickJsWalletKitEngine"
    private val appContext = context.applicationContext
    internal val applicationContext: Context get() = appContext
    private val assetManager = appContext.assets
    private val listeners = CopyOnWriteArraySet<WalletKitEngineListener>()
    private val ready = CompletableDeferred<Unit>()
    private val pending = ConcurrentHashMap<String, CompletableDeferred<BridgeResponse>>()
    internal val timerIdGenerator = AtomicInteger(1)
    private val timers = ConcurrentHashMap<Int, TimerHandle>()
    internal val fetchIdGenerator = AtomicInteger(1)
    internal val activeFetchCalls = ConcurrentHashMap<Int, Call>()
    internal val eventSourceIdGenerator = AtomicInteger(1)
    private val eventSources = ConcurrentHashMap<Int, EventSourceConnection>()
    private val scriptCache = ConcurrentHashMap<String, String>()

    private val jsExecutor = Executors.newSingleThreadExecutor { runnable ->
        Thread(runnable, "WalletKitQuickJs").apply { isDaemon = true }
    }
    private val jsDispatcher = jsExecutor.asCoroutineDispatcher()
    private val jsScope = CoroutineScope(jsDispatcher + SupervisorJob())
    private val ioScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val mainScope = CoroutineScope(Dispatchers.Main.immediate + SupervisorJob())
    private val timerExecutor = ScheduledThreadPoolExecutor(1) { runnable ->
        Thread(runnable, "WalletKitQuickJsTimer").apply { isDaemon = true }
    }.apply {
        removeOnCancelPolicy = true
    }
    private val quickJsDeferred = CompletableDeferred<QuickJs>()

    @Volatile private var quickJsInstance: QuickJs? = null
    private val random = SecureRandom()
    private val jsEvaluateMutex = Mutex()

    // Native helper instances
    internal val nativeFetch = NativeFetch()
    internal val nativeEventSource = NativeEventSource()
    internal val nativeTimers = NativeTimers()

    @Volatile private var currentNetwork: String = "testnet"

    @Volatile private var apiBaseUrl: String = "https://testnet.tonapi.io"

    @Volatile private var tonApiKey: String? = null

    // Auto-initialization state
    @Volatile private var isWalletKitInitialized = false
    private val walletKitInitMutex = Mutex()
    private var pendingInitConfig: WalletKitBridgeConfig? = null

    init {
        jsScope.launch {
            try {
                Log.d(logTag, "Creating QuickJS instance...")
                val quickJs = QuickJs.create()
                Log.d(logTag, "Installing native bindings...")
                installNativeBindings(quickJs)
                Log.d(logTag, "Evaluating bootstrap...")
                evaluateBootstrap(quickJs)
                Log.d(logTag, "Installing text encoding shim...")
                installTextEncodingShim(quickJs)
                Log.d(logTag, "Loading bundle...")
                loadBundle(quickJs)
                Log.d(logTag, "Bundle loaded successfully")
                quickJsInstance = quickJs
                quickJsDeferred.complete(quickJs)
                Log.d(logTag, "QuickJS initialization complete, waiting for ready event...")
            } catch (err: Throwable) {
                Log.e(logTag, "Failed to initialise QuickJS runtime", err)
                quickJsDeferred.completeExceptionally(err)
                if (!ready.isCompleted) {
                    ready.completeExceptionally(
                        WalletKitBridgeException(
                            err.message ?: "Failed to initialise QuickJS runtime",
                        ),
                    )
                }
            }
        }
    }

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
        apiBaseUrl = config.tonApiUrl?.ifBlank { null } ?: defaultTonApiBase(config.network)
        tonApiKey = config.apiKey

        val payload =
            JSONObject().apply {
                put("network", config.network)
                put("apiUrl", tonClientEndpoint)
                config.apiUrl?.let { put("apiBaseUrl", it) }
                config.tonApiUrl?.let { put("tonApiUrl", it) }
                config.bridgeUrl?.let { put("bridgeUrl", it) }
                config.bridgeName?.let { put("bridgeName", it) }
                config.allowMemoryStorage?.let { put("allowMemoryStorage", it) }
                tonApiKey?.let { put("apiKey", it) }
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
        Log.d(logTag, "getWallets() called")
        val result = call("getWallets")
        Log.d(logTag, "getWallets result: $result")
        val items = result.optJSONArray("items") ?: JSONArray()
        Log.d(logTag, "getWallets items count: ${items.length()}")
        return buildList(items.length()) {
            for (index in 0 until items.length()) {
                val entry = items.optJSONObject(index) ?: continue
                val account = WalletAccount(
                    address = entry.optString("address"),
                    publicKey = entry.optNullableString("publicKey"),
                    version = entry.optString("version", "unknown"),
                    network = entry.optString("network", currentNetwork),
                    index = entry.optInt("index", index),
                )
                Log.d(logTag, "getWallets account: ${account.address}")
                add(account)
            }
        }
    }

    override suspend fun removeWallet(address: String): JSONObject {
        ensureWalletKitInitialized()
        Log.d(logTag, "removeWallet called for address: $address")
        val params = JSONObject().apply { put("address", address) }
        val result = call("removeWallet", params)
        Log.d(logTag, "removeWallet result: $result")
        return result
    }

    override suspend fun getWalletState(address: String): WalletState {
        ensureWalletKitInitialized()
        Log.d(logTag, "getWalletState called for address: $address")
        val params = JSONObject().apply { put("address", address) }
        Log.d(logTag, "getWalletState calling JavaScript...")
        val result = call("getWalletState", params)
        Log.d(logTag, "getWalletState result: $result")
        val balance = when {
            result.has("balance") -> result.optString("balance")
            result.has("value") -> result.optString("value")
            else -> null
        }
        Log.d(logTag, "getWalletState balance: $balance")
        return WalletState(
            balance = balance,
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

    override suspend fun injectSignDataRequest(requestData: JSONObject): JSONObject {
        ensureWalletKitInitialized()
        return call("injectSignDataRequest", requestData)
    }

    override suspend fun destroy() {
        withContext(jsDispatcher) {
            quickJsInstance?.close()
            quickJsInstance = null
            if (!quickJsDeferred.isCompleted) {
                quickJsDeferred.cancel()
            }
        }
        timers.values.forEach { handle ->
            handle.future?.cancel(true)
        }
        timers.clear()
        timerExecutor.shutdownNow()
        activeFetchCalls.values.forEach { call ->
            call.cancel()
        }
        activeFetchCalls.clear()
        ioScope.cancel()
        mainScope.cancel()
        jsScope.cancel()
        jsExecutor.shutdownNow()
    }

    private suspend fun call(
        method: String,
        params: JSONObject? = null,
    ): JSONObject {
        ready.await()
        Log.d(logTag, "call: method=$method, params=$params")
        val callId = UUID.randomUUID().toString()
        val deferred = CompletableDeferred<BridgeResponse>()
        pending[callId] = deferred
        val payload = params?.toString()
        val idLiteral = JSONObject.quote(callId)
        val methodLiteral = JSONObject.quote(method)
        val script =
            if (payload == null) {
                "globalThis.__walletkitCall($idLiteral,$methodLiteral,null)"
            } else {
                val payloadLiteral = JSONObject.quote(payload)
                "globalThis.__walletkitCall($idLiteral,$methodLiteral,$payloadLiteral)"
            }
        Log.d(logTag, "call: evaluating script...")
        evaluate(script, "walletkit-call.js")
        Log.d(logTag, "call: waiting for response...")
        val response = deferred.await()
        Log.d(logTag, "call: got response")
        return response.result
    }

    private suspend fun evaluate(script: String, filename: String = "walletkit-eval.js") {
        val quickJs = quickJsDeferred.await()
        withContext(jsDispatcher) {
            jsEvaluateMutex.withLock {
                quickJs.evaluate(script, filename)
                drainPendingJobsLocked(quickJs)
            }
        }
    }

    private fun drainPendingJobsLocked(runtime: QuickJs) {
        while (true) {
            val jobsProcessed = try {
                runtime.executePendingJob()
            } catch (err: Throwable) {
                Log.e(logTag, "QuickJS pending job failed", err)
                return
            }
            if (jobsProcessed <= 0) {
                return
            }
        }
    }

    private fun readJsAsset(relativePath: String): String = scriptCache.getOrPut(relativePath) {
        assetManager.open(relativePath).bufferedReader(StandardCharsets.UTF_8).use { it.readText() }
    }

    private fun failPendingRequests(message: String) {
        pending.values.forEach { deferred ->
            if (!deferred.isCompleted) {
                deferred.completeExceptionally(WalletKitBridgeException(message))
            }
        }
    }

    private fun installNativeBindings(quickJs: QuickJs) {
        Log.d(logTag, "Setting WalletKitNative (class, no @JvmStatic, let QuickJS instantiate)...")
        // Set engine reference BEFORE registering with QuickJS
        QuickJsNativeHost.engine = this

        // DEBUG: Try calling the method directly from Kotlin to verify it works
        Log.d(logTag, "Direct Kotlin call test:")
        val testInstance = QuickJsNativeHost()
        val directResult = testInstance.cryptoRandomBytes("32")
        Log.d(logTag, "Direct call returned: $directResult (${directResult.length} chars)")

        // Register class - let QuickJS create its own instance via reflection
        quickJs.set("WalletKitNative", QuickJsNativeHost::class.java, testInstance)

        Log.d(logTag, "All native bindings installed via unified host")
    }

    private fun evaluateBootstrap(quickJs: QuickJs) {
        // Test the unified host
        Log.d(logTag, "Testing unified WalletKitNative host...")

        // Test 1: Check if functions are different objects
        val identityTest = quickJs.evaluate(
            """
            (function() {
              return 'base64Decode === cryptoRandomBytes: ' + (WalletKitNative.base64Decode === WalletKitNative.cryptoRandomBytes);
            })();
            """.trimIndent(),
            "test-identity.js",
        )
        Log.d(logTag, "Identity test = $identityTest")

        // Test 2: Check object structure
        val structureTest = quickJs.evaluate(
            """
            (function() {
              var keys = Object.keys(WalletKitNative).sort();
              return 'Methods: ' + keys.join(', ');
            })();
            """.trimIndent(),
            "test-structure.js",
        )
        Log.d(logTag, "Structure test = $structureTest")

        // Test 3: Call base64Decode explicitly
        val base64Test = quickJs.evaluate(
            """WalletKitNative.base64Decode('aGVsbG8=')""",
            "test-base64.js",
        )
        Log.d(logTag, "base64Decode('aGVsbG8=') = '$base64Test'")

        // Test 4: Call base64Encode explicitly
        val encodeTest = quickJs.evaluate(
            """WalletKitNative.base64Encode('hello')""",
            "test-encode.js",
        )
        Log.d(logTag, "base64Encode('hello') = '$encodeTest'")

        // Test 5: Call cryptoRandomBytes explicitly
        val cryptoTest = quickJs.evaluate(
            """WalletKitNative.cryptoRandomBytes('32')""",
            "test-crypto.js",
        )
        Log.d(logTag, "cryptoRandomBytes('32') = '$cryptoTest' (len=${cryptoTest.toString().length})")

        quickJs.evaluate(readJsAsset(BOOTSTRAP_SCRIPT_ASSET), "walletkit-bootstrap.js")
        drainPendingJobsLocked(quickJs)

        Log.d(logTag, "Bootstrap evaluation complete")
    }

    private fun installTextEncodingShim(quickJs: QuickJs) {
        quickJs.evaluate(readJsAsset(TEXT_ENCODING_ASSET), "walletkit-text-encoding.js")
        drainPendingJobsLocked(quickJs)
    }

    private fun loadBundle(quickJs: QuickJs) {
        quickJs.evaluate(readJsAsset(ENVIRONMENT_SHIM_ASSET), "walletkit-environment.js")
        val source = readJsAsset(assetPath)
        quickJs.evaluate(source, assetPath)
        // Drain pending jobs to execute any initialization code
        Log.d(logTag, "Draining pending jobs after bundle load...")
        drainPendingJobsLocked(quickJs)
        Log.d(logTag, "Pending jobs drained")
    }

    internal fun handleReady(payload: JSONObject) {
        payload.optNullableString("network")?.let { currentNetwork = it }
        payload.optNullableString("tonApiUrl")?.let { apiBaseUrl = it }
        if (!ready.isCompleted) {
            Log.d(logTag, "QuickJS bridge ready")
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

    internal fun handleResponse(
        id: String,
        payload: JSONObject,
    ) {
        val deferred = pending.remove(id) ?: return
        val error = payload.optJSONObject("error")
        if (error != null) {
            val message = error.optString("message", "WalletKit bridge error")
            Log.e(logTag, "handleResponse error: $error")
            deferred.completeExceptionally(WalletKitBridgeException(message))
            return
        }
        val result = payload.opt("result")
        val data =
            when (result) {
                is JSONObject -> result
                is JSONArray -> JSONObject().put("items", result)
                null -> JSONObject()
                else -> JSONObject().put("value", result)
            }
        deferred.complete(BridgeResponse(data))
    }

    internal fun handleEvent(event: JSONObject) {
        val type = event.optString("type", "unknown")
        val walletEvent = WalletKitEvent(type, event.optJSONObject("data") ?: JSONObject(), event)
        listeners.forEach { listener ->
            mainScope.launch { listener.onEvent(walletEvent) }
        }
    }

    private fun JSONObject.optNullableString(key: String): String? {
        val value = opt(key)
        return when (value) {
            null, JSONObject.NULL -> null
            else -> value.toString()
        }
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

    private inner class NativeBridge {
        fun postMessage(json: Any?) {
            Log.v(logTag, ">>> NativeBridge.postMessage CALLED with type: ${json?.javaClass?.simpleName}")
            try {
                Log.d(logTag, "NativeBridge.postMessage called with type: ${json?.javaClass?.simpleName}, value: ${if (json is String) json.take(200) else json}")

                // Convert to string if needed (QuickJS might pass different types)
                val jsonString = when (json) {
                    is String -> json
                    is Number -> {
                        Log.w(logTag, "postMessage received number: $json (likely a char code or unexpected value) - ignoring")
                        return // Ignore numeric values
                    }
                    null -> {
                        Log.w(logTag, "postMessage received null - ignoring")
                        return
                    }
                    else -> {
                        Log.w(logTag, "postMessage received unexpected type: ${json::class.java.simpleName}, value: $json - converting to string")
                        json.toString()
                    }
                }

                val payload = JSONObject(jsonString)
                val kind = payload.optString("kind")
                Log.d(logTag, "postMessage payload kind: $kind")

                when (kind) {
                    "ready" -> handleReady(payload)
                    "event" -> payload.optJSONObject("event")?.let { handleEvent(it) }
                    "response" -> handleResponse(payload.optString("id"), payload)
                }
            } catch (err: JSONException) {
                Log.e(logTag, "Malformed payload from QuickJS: $json", err)
                // Don't fail pending requests for malformed payloads during initialization
            } catch (err: Throwable) {
                Log.e(logTag, "NativeBridge.postMessage error", err)
                // Don't rethrow - this would break QuickJS initialization
            }
        }
    }

    private inner class NativeConsole {
        fun log(level: String, message: String): String {
            System.out.println(">>> NativeConsole.log CALLED: level=$level, message=$message")
            Log.v(logTag, ">>> NativeConsole.log CALLED: level=$level, message=$message")
            try {
                when (level.lowercase()) {
                    "error" -> Log.e(logTag, message)
                    "warn" -> Log.w(logTag, message)
                    else -> Log.d(logTag, message)
                }
            } catch (err: Throwable) {
                Log.e(logTag, "NativeConsole.log error", err)
            }
            return "logged-ok"
        }
    }

    private inner class NativeBase64 {
        fun encode(value: String): String = try {
            val bytes = value.toByteArray(Charsets.ISO_8859_1)
            Base64.encodeToString(bytes, Base64.NO_WRAP)
        } catch (err: Throwable) {
            Log.w(logTag, "NativeBase64.encode failed for input: '${value.take(100)}': ${err.message}")
            "" // Return empty string on error
        }

        fun decode(value: String): String {
            return try {
                // Handle empty or whitespace-only strings
                if (value.isBlank()) {
                    return ""
                }
                val bytes = Base64.decode(value, Base64.NO_WRAP)
                String(bytes, Charsets.ISO_8859_1)
            } catch (err: Throwable) {
                // Log as warning, not error - this can happen with invalid input and is handled gracefully
                Log.w(logTag, "NativeBase64.decode failed for input: '${value.take(100)}' (length: ${value.length}): ${err.message}")
                "" // Return empty string on error
            }
        }
    }

    private inner class NativeCrypto {
        fun randomBytes(length: Int): String = try {
            val buffer = ByteArray(length.coerceAtLeast(0))
            random.nextBytes(buffer)
            Base64.encodeToString(buffer, Base64.NO_WRAP)
        } catch (err: Throwable) {
            Log.e(logTag, "NativeCrypto.randomBytes error", err)
            ""
        }

        fun randomUuid(): String = try {
            UUID.randomUUID().toString()
        } catch (err: Throwable) {
            Log.e(logTag, "NativeCrypto.randomUuid error", err)
            ""
        }

        fun pbkdf2Sha512(keyBase64: String, saltBase64: String, iterations: Int, keyLen: Int): String {
            Log.d(logTag, "NativeCrypto.pbkdf2Sha512 called: iterations=$iterations, keyLen=$keyLen")
            return try {
                val key = Base64.decode(keyBase64, Base64.NO_WRAP)
                val salt = Base64.decode(saltBase64, Base64.NO_WRAP)

                val spec = javax.crypto.spec.PBEKeySpec(
                    String(key, Charsets.UTF_8).toCharArray(),
                    salt,
                    iterations,
                    keyLen * 8,
                )
                val factory = javax.crypto.SecretKeyFactory.getInstance("PBKDF2WithHmacSHA512")
                val derived = factory.generateSecret(spec).encoded

                val result = Base64.encodeToString(derived, Base64.NO_WRAP)
                Log.d(logTag, "NativeCrypto.pbkdf2Sha512 success, result length=${result.length}")
                result
            } catch (err: Throwable) {
                Log.e(logTag, "NativeCrypto.pbkdf2Sha512 error", err)
                ""
            }
        }
    }

    internal inner class NativeTimers {
        fun request(delayMs: Double, repeat: Boolean): Int = try {
            val id = timerIdGenerator.getAndIncrement()
            val delay =
                when {
                    delayMs.isNaN() || delayMs.isInfinite() -> 0L
                    delayMs < 0 -> 0L
                    else -> delayMs.toLong()
                }
            createTimer(id, delay, repeat)
            id
        } catch (err: Throwable) {
            Log.e(logTag, "NativeTimers.request error", err)
            -1
        }

        fun clear(id: Int) {
            try {
                cancelTimer(id)
            } catch (err: Throwable) {
                Log.e(logTag, "NativeTimers.clear error", err)
            }
        }
    }

    internal inner class NativeFetch {
        fun perform(requestJson: String): Int {
            val requestId = fetchIdGenerator.getAndIncrement()
            try {
                val json = JSONObject(requestJson)
                val url = json.optString("url")
                val method = json.optString("method", "GET").ifBlank { "GET" }
                Log.d(logTag, "NativeFetch.perform: id=$requestId, method=$method, url=${url.take(100)}")
                if (url.isNullOrBlank()) {
                    deliverFetchError(requestId, "Missing URL")
                    return requestId
                }
                val headers = json.optJSONArray("headers")
                val headersBuilder = Headers.Builder()
                if (headers != null) {
                    for (index in 0 until headers.length()) {
                        val pair = headers.optJSONArray(index) ?: continue
                        val name = pair.optString(0)
                        val value = pair.optString(1)
                        if (name.isNotBlank()) {
                            headersBuilder.add(name, value)
                        }
                    }
                }
                val headersBuilt = headersBuilder.build()
                val bodyBase64 = json.optString("bodyBase64", "").takeIf { it.isNotEmpty() }
                val requestBody = createRequestBody(method.uppercase(), headersBuilt, bodyBase64)
                val request =
                    Request.Builder()
                        .url(url)
                        .headers(headersBuilt)
                        .method(method.uppercase(), requestBody)
                        .build()
                ioScope.launch {
                    executeFetch(requestId, request)
                }
            } catch (err: Throwable) {
                deliverFetchError(requestId, err.message ?: "Fetch request failed")
            }
            return requestId
        }

        fun abort(id: Int) {
            try {
                activeFetchCalls.remove(id)?.cancel()
                deliverFetchError(id, "Aborted")
            } catch (err: Throwable) {
                Log.e(logTag, "NativeFetch.abort error", err)
            }
        }
    }

    private fun createRequestBody(
        method: String,
        headers: Headers,
        bodyBase64: String?,
    ): RequestBody? {
        val requiresBody = method !in listOf("GET", "HEAD")
        if (bodyBase64 == null) {
            return if (requiresBody) {
                ByteArray(0).toRequestBody(null)
            } else {
                null
            }
        }
        val bodyBytes = Base64.decode(bodyBase64, Base64.NO_WRAP)
        val mediaType = headers["Content-Type"]?.toMediaTypeOrNull()
        return bodyBytes.toRequestBody(mediaType)
    }

    private suspend fun executeFetch(
        id: Int,
        request: Request,
    ) {
        val call = httpClient.newCall(request)
        activeFetchCalls[id] = call
        try {
            Log.d(logTag, "executeFetch: id=$id, executing ${request.method} ${request.url}")
            // Log headers and body for bridge requests
            if (request.url.toString().contains("bridge.tonapi.io")) {
                Log.d(logTag, "executeFetch: id=$id, Bridge POST - headers: ${request.headers}")
                request.body?.let { body ->
                    val buffer = okio.Buffer()
                    body.writeTo(buffer)
                    val bodyString = buffer.readUtf8()
                    Log.d(logTag, "executeFetch: id=$id, Bridge POST - body: ${bodyString.take(200)}")
                }
            }
            val response = suspendCancellableCall(call)
            Log.d(logTag, "executeFetch: id=$id, got response status=${response.code}")
            val bodyBytes = response.body?.bytes()
            val base64Body =
                if (bodyBytes != null && bodyBytes.isNotEmpty()) {
                    Base64.encodeToString(bodyBytes, Base64.NO_WRAP)
                } else {
                    null
                }
            val headersArray = JSONArray()
            for ((name, value) in response.headers) {
                headersArray.put(JSONArray().put(name).put(value))
            }
            val meta =
                JSONObject().apply {
                    put("status", response.code)
                    put("statusText", response.message)
                    put("headers", headersArray)
                }
            deliverFetchSuccess(id, meta.toString(), base64Body)
            response.close()
        } catch (err: Throwable) {
            Log.e(logTag, "executeFetch: id=$id, error: ${err.message}", err)
            deliverFetchError(id, err.message ?: "Network error")
        } finally {
            activeFetchCalls.remove(id)
        }
    }

    private suspend fun suspendCancellableCall(call: Call): okhttp3.Response = suspendCancellableCoroutine { continuation: CancellableContinuation<okhttp3.Response> ->
        continuation.invokeOnCancellation { call.cancel() }
        call.enqueue(
            object : okhttp3.Callback {
                override fun onFailure(call: Call, e: IOException) {
                    if (continuation.isCancelled) {
                        return
                    }
                    continuation.resumeWithException(e)
                }

                override fun onResponse(call: Call, response: okhttp3.Response) {
                    continuation.resume(response)
                }
            },
        )
    }

    private fun deliverFetchSuccess(
        id: Int,
        metaJson: String,
        bodyBase64: String?,
    ) {
        jsScope.launch {
            val metaLiteral = JSONObject.quote(metaJson)
            val bodyLiteral = if (bodyBase64 != null) JSONObject.quote(bodyBase64) else "null"
            val script =
                "globalThis.__walletkitResolveFetch($id,$metaLiteral,$bodyLiteral)"
            try {
                evaluate(script, "walletkit-fetch-success.js")
            } catch (err: Throwable) {
                Log.e(logTag, "Failed to deliver fetch success", err)
            }
        }
    }

    internal fun deliverFetchError(
        id: Int,
        message: String,
    ) {
        jsScope.launch {
            val errorLiteral = JSONObject.quote(message)
            val script = "globalThis.__walletkitRejectFetch($id,$errorLiteral)"
            try {
                evaluate(script, "walletkit-fetch-error.js")
            } catch (err: Throwable) {
                Log.e(logTag, "Failed to deliver fetch error", err)
            }
        }
    }

    private fun createTimer(
        id: Int,
        delay: Long,
        repeat: Boolean,
    ) {
        lateinit var handle: TimerHandle
        val task = Runnable {
            jsScope.launch {
                try {
                    evaluate("globalThis.__walletkitRunTimer($id)", "walletkit-timer.js")
                } catch (err: Throwable) {
                    Log.e(logTag, "Timer $id execution failed", err)
                }
            }
            if (repeat) {
                rescheduleTimer(handle)
            } else {
                timers.remove(id)
            }
        }
        handle = TimerHandle(id, repeat, delay, task)
        handle.future = timerExecutor.schedule(task, delay.coerceAtLeast(0L), TimeUnit.MILLISECONDS)
        timers[id] = handle
    }

    private fun rescheduleTimer(handle: TimerHandle) {
        handle.future?.cancel(false)
        handle.future = timerExecutor.schedule(handle.task, handle.delayMillis, TimeUnit.MILLISECONDS)
    }

    private fun deliverEventSourceOpen(id: Int) {
        jsScope.launch {
            try {
                evaluate("globalThis.__walletkitEventSourceOnOpen($id)", "walletkit-eventsource-open.js")
            } catch (err: Throwable) {
                Log.e(logTag, "Failed to deliver EventSource open", err)
            }
        }
    }

    private fun deliverEventSourceMessage(
        id: Int,
        eventType: String,
        data: String,
        lastEventId: String?,
    ) {
        jsScope.launch {
            val typeLiteral = JSONObject.quote(eventType)
            val dataLiteral = JSONObject.quote(data)
            val idLiteral = lastEventId?.let { JSONObject.quote(it) } ?: "null"
            val script = "globalThis.__walletkitEventSourceOnMessage($id,$typeLiteral,$dataLiteral,$idLiteral)"
            try {
                evaluate(script, "walletkit-eventsource-message.js")
            } catch (err: Throwable) {
                Log.e(logTag, "Failed to deliver EventSource message", err)
            }
        }
    }

    internal fun deliverEventSourceError(id: Int, message: String?) {
        jsScope.launch {
            val messageLiteral = message?.let { JSONObject.quote(it) } ?: "null"
            val script = "globalThis.__walletkitEventSourceOnError($id,$messageLiteral)"
            try {
                evaluate(script, "walletkit-eventsource-error.js")
            } catch (err: Throwable) {
                Log.e(logTag, "Failed to deliver EventSource error", err)
            }
        }
    }

    internal fun deliverEventSourceClosed(id: Int, reason: String?) {
        jsScope.launch {
            val reasonLiteral = reason?.let { JSONObject.quote(it) } ?: "null"
            val script = "globalThis.__walletkitEventSourceOnClose($id,$reasonLiteral)"
            try {
                evaluate(script, "walletkit-eventsource-close.js")
            } catch (err: Throwable) {
                Log.e(logTag, "Failed to deliver EventSource close", err)
            }
        }
    }

    private fun cancelTimer(id: Int) {
        timers.remove(id)?.future?.cancel(true)
    }

    private data class TimerHandle(
        val id: Int,
        val repeat: Boolean,
        val delayMillis: Long,
        val task: Runnable,
        @Volatile var future: ScheduledFuture<*>? = null,
    )

    internal inner class NativeEventSource {
        fun open(url: String?, withCredentials: Boolean): Int {
            val id = eventSourceIdGenerator.getAndIncrement()
            return try {
                val normalized = url?.takeIf { it.isNotBlank() }
                if (normalized == null) {
                    Log.e(logTag, "EventSource open rejected due to empty URL")
                    deliverEventSourceError(id, "Invalid EventSource URL")
                    deliverEventSourceClosed(id, "invalid-url")
                    return id
                }
                val connection = EventSourceConnection(id, normalized, withCredentials)
                eventSources[id] = connection
                ioScope.launch { connection.start() }
                id
            } catch (err: Throwable) {
                Log.e(logTag, "NativeEventSource.open error", err)
                deliverEventSourceError(id, err.message ?: "EventSource open failed")
                deliverEventSourceClosed(id, err::class.java.simpleName)
                id
            }
        }

        fun close(id: Int) {
            try {
                eventSources.remove(id)?.close()
            } catch (err: Throwable) {
                Log.e(logTag, "NativeEventSource.close error", err)
            }
        }
    }

    private inner class EventSourceConnection(
        private val id: Int,
        private val url: String,
        private val withCredentials: Boolean,
    ) {
        @Volatile private var call: Call? = null

        @Volatile private var closed: Boolean = false

        suspend fun start() {
            try {
                val requestBuilder =
                    Request.Builder()
                        .url(url)
                        .header("Accept", "text/event-stream")
                        .header("Cache-Control", "no-cache")
                        .header("Connection", "keep-alive")
                if (!withCredentials) {
                    requestBuilder.header("Cookie", "")
                }
                val request = requestBuilder.build()
                val call = httpClient.newCall(request)
                this.call = call
                val response = call.execute()
                if (!response.isSuccessful) {
                    deliverEventSourceError(id, "HTTP ${response.code}")
                    response.close()
                    deliverEventSourceClosed(id, "http")
                    return
                }
                val body = response.body
                if (body == null) {
                    deliverEventSourceError(id, "Empty EventSource body")
                    response.close()
                    deliverEventSourceClosed(id, "empty")
                    return
                }
                deliverEventSourceOpen(id)
                try {
                    readEventStream(body.source())
                } finally {
                    body.close()
                    response.close()
                }
                if (!closed) {
                    deliverEventSourceClosed(id, null)
                }
            } catch (err: Throwable) {
                if (!closed) {
                    deliverEventSourceError(id, err.message ?: "EventSource error")
                    deliverEventSourceClosed(id, err::class.java.simpleName)
                }
            } finally {
                eventSources.remove(id, this)
            }
        }

        fun close() {
            closed = true
            call?.cancel()
        }

        private fun readEventStream(source: BufferedSource) {
            var eventType = "message"
            val dataBuilder = StringBuilder()
            var lastEventId: String? = null
            while (!closed) {
                val line =
                    try {
                        source.readUtf8Line()
                    } catch (err: IOException) {
                        if (!closed) {
                            throw err
                        }
                        null
                    }
                        ?: break

                if (line.isEmpty()) {
                    if (dataBuilder.isNotEmpty()) {
                        val payload =
                            if (dataBuilder[dataBuilder.length - 1] == '\n') {
                                dataBuilder.substring(0, dataBuilder.length - 1)
                            } else {
                                dataBuilder.toString()
                            }
                        deliverEventSourceMessage(id, eventType.ifBlank { "message" }, payload, lastEventId)
                        dataBuilder.setLength(0)
                    }
                    eventType = "message"
                    continue
                }

                if (line.startsWith(":")) {
                    continue
                }

                val delimiterIndex = line.indexOf(':')
                val field: String
                var value = ""
                if (delimiterIndex == -1) {
                    field = line
                } else {
                    field = line.substring(0, delimiterIndex)
                    value = line.substring(delimiterIndex + 1)
                    if (value.startsWith(" ")) {
                        value = value.substring(1)
                    }
                }

                when (field) {
                    "event" -> eventType = value.ifBlank { "message" }
                    "data" -> {
                        dataBuilder.append(value)
                        dataBuilder.append('\n')
                    }
                    "id" -> lastEventId = value
                    "retry" -> Unit
                }
            }

            if (dataBuilder.isNotEmpty()) {
                val payload =
                    if (dataBuilder[dataBuilder.length - 1] == '\n') {
                        dataBuilder.substring(0, dataBuilder.length - 1)
                    } else {
                        dataBuilder.toString()
                    }
                deliverEventSourceMessage(id, eventType.ifBlank { "message" }, payload, lastEventId)
                dataBuilder.setLength(0)
            }
        }
    }

    private data class BridgeResponse(val result: JSONObject)

    companion object {
        private const val QUICKJS_ASSET_DIR = "walletkit/quickjs/"
        private const val DEFAULT_BUNDLE_ASSET = QUICKJS_ASSET_DIR + "index.js"
        private const val BOOTSTRAP_SCRIPT_ASSET = QUICKJS_ASSET_DIR + "bootstrap.js"
        private const val ENVIRONMENT_SHIM_ASSET = QUICKJS_ASSET_DIR + "environment.js"
        private const val TEXT_ENCODING_ASSET = QUICKJS_ASSET_DIR + "text-encoding.js"

        private fun defaultHttpClient(): OkHttpClient = OkHttpClient.Builder()
            .followRedirects(true)
            .followSslRedirects(true)
            .retryOnConnectionFailure(true)
            .readTimeout(0, java.util.concurrent.TimeUnit.SECONDS) // Disable read timeout for EventSource
            .build()
    }
}

// Unified Native Host for QuickJS
// Final attempt: Regular class, no constructor params, instance methods (not static)
// Let QuickJS create its own instance via reflection
class QuickJsNativeHost {
    private val random = SecureRandom()

    companion object {

        var engine: QuickJsWalletKitEngine? = null
    }

    // ============ Bridge Methods ============
    fun postMessage(json: String) {
        val eng = engine ?: return
        try {
            // Check if this is a formatted log message (starts with [level])
            if (json.startsWith("[") && json.contains("]")) {
                val closeBracket = json.indexOf(']')
                if (closeBracket > 0 && closeBracket < 20) {
                    val level = json.substring(1, closeBracket)
                    val message = json.substring(closeBracket + 1).trim()
                    when (level) {
                        "error" -> Log.e(eng.logTag, message)
                        "warn" -> Log.w(eng.logTag, message)
                        "info" -> Log.i(eng.logTag, message)
                        "debug" -> Log.d(eng.logTag, message)
                        else -> Log.d(eng.logTag, json)
                    }
                    return
                }
            }

            // Try parsing as JSON
            val payload = JSONObject(json)
            val kind = payload.optString("kind")

            when (kind) {
                "ready" -> eng.handleReady(payload)
                "event" -> payload.optJSONObject("event")?.let { eng.handleEvent(it) }
                "response" -> eng.handleResponse(payload.optString("id"), payload)
            }
        } catch (err: JSONException) {
            Log.d(eng.logTag, "Non-JSON message from QuickJS: ${json.take(200)}")
        } catch (err: Throwable) {
            Log.e(eng.logTag, "NativeHost.postMessage error", err)
        }
    }

    // ============ Console Methods ============

    fun consoleLog(message: String) {
        postMessage(message)
    }

    // ============ Base64 Methods ============

    fun base64Encode(value: String): String = try {
        val bytes = value.toByteArray(Charsets.ISO_8859_1)
        Base64.encodeToString(bytes, Base64.NO_WRAP)
    } catch (err: Throwable) {
        engine?.logTag?.let { Log.w(it, "base64Encode failed: ${err.message}") }
        ""
    }

    fun base64Decode(value: String): String {
        return try {
            if (value.isBlank()) return ""
            val bytes = Base64.decode(value, Base64.NO_WRAP)
            String(bytes, Charsets.ISO_8859_1)
        } catch (err: Throwable) {
            engine?.logTag?.let { Log.w(it, "base64Decode failed: ${err.message}") }
            ""
        }
    }

    // ============ Crypto Methods ============

    fun cryptoRandomBytes(lengthStr: String): String {
        Log.d("QuickJsNativeHost", "cryptoRandomBytes called with: $lengthStr")
        val eng = engine
        if (eng == null) {
            Log.e("QuickJsNativeHost", "engine is null!")
            return ""
        }
        Log.d(eng.logTag, "cryptoRandomBytes: engine is set, processing...")
        return try {
            val length = lengthStr.toIntOrNull() ?: 32
            Log.d(eng.logTag, "cryptoRandomBytes parsed length: $length")
            val buffer = ByteArray(length.coerceAtLeast(0))
            random.nextBytes(buffer)
            val result = Base64.encodeToString(buffer, Base64.NO_WRAP)
            Log.d(eng.logTag, "cryptoRandomBytes returning ${result.length} chars")
            result
        } catch (err: Throwable) {
            Log.e(eng.logTag, "cryptoRandomBytes error", err)
            ""
        }
    }

    fun cryptoRandomUuid(): String = try {
        UUID.randomUUID().toString()
    } catch (err: Throwable) {
        engine?.logTag?.let { Log.e(it, "cryptoRandomUuid error", err) }
        ""
    }

    fun cryptoPbkdf2Sha512(keyBase64: String, saltBase64: String, iterations: Int, keyLen: Int): String {
        val eng = engine ?: return ""
        Log.d(eng.logTag, "cryptoPbkdf2Sha512 called: iterations=$iterations, keyLen=$keyLen")
        return try {
            val key = Base64.decode(keyBase64, Base64.NO_WRAP)
            val salt = Base64.decode(saltBase64, Base64.NO_WRAP)

            val spec = javax.crypto.spec.PBEKeySpec(
                String(key, Charsets.UTF_8).toCharArray(),
                salt,
                iterations,
                keyLen * 8,
            )
            val factory = javax.crypto.SecretKeyFactory.getInstance("PBKDF2WithHmacSHA512")
            val derived = factory.generateSecret(spec).encoded

            val result = Base64.encodeToString(derived, Base64.NO_WRAP)
            Log.d(eng.logTag, "cryptoPbkdf2Sha512 success, result length=${result.length}")
            result
        } catch (err: Throwable) {
            Log.e(eng.logTag, "cryptoPbkdf2Sha512 error", err)
            ""
        }
    }

    fun cryptoHmacSha512(keyBase64: String, dataBase64: String): String {
        val eng = engine ?: return ""
        return try {
            val key = Base64.decode(keyBase64, Base64.NO_WRAP)
            val data = Base64.decode(dataBase64, Base64.NO_WRAP)

            val mac = javax.crypto.Mac.getInstance("HmacSHA512")
            val secretKey = javax.crypto.spec.SecretKeySpec(key, "HmacSHA512")
            mac.init(secretKey)
            val result = mac.doFinal(data)

            Base64.encodeToString(result, Base64.NO_WRAP)
        } catch (err: Throwable) {
            Log.e(eng.logTag, "cryptoHmacSha512 error", err)
            ""
        }
    }

    fun cryptoSha256(dataBase64: String): String {
        val eng = engine ?: return ""
        return try {
            val data = Base64.decode(dataBase64, Base64.NO_WRAP)
            val digest = java.security.MessageDigest.getInstance("SHA-256")
            val result = digest.digest(data)
            Base64.encodeToString(result, Base64.NO_WRAP)
        } catch (err: Throwable) {
            Log.e(eng.logTag, "cryptoSha256 error", err)
            ""
        }
    }

    // ============ Timer Methods ============

    fun timerRequest(paramsJson: String): String {
        val eng = engine ?: return "-1"
        return try {
            val params = JSONObject(paramsJson)
            val delayMs = params.optDouble("delay", 0.0)
            val repeat = params.optBoolean("repeat", false)
            eng.nativeTimers.request(delayMs, repeat).toString()
        } catch (err: Throwable) {
            Log.e(eng.logTag, "timerRequest error", err)
            "-1"
        }
    }

    fun timerClear(idStr: String) {
        val eng = engine ?: return
        try {
            val id = idStr.toIntOrNull() ?: return
            eng.nativeTimers.clear(id)
        } catch (err: Throwable) {
            Log.e(eng.logTag, "timerClear error", err)
        }
    }

    // ============ Fetch Methods ============

    fun fetchPerform(requestJson: String): String {
        val eng = engine ?: return "-1"
        return try {
            eng.nativeFetch.perform(requestJson).toString()
        } catch (err: Throwable) {
            Log.e(eng.logTag, "fetchPerform error", err)
            val requestId = eng.fetchIdGenerator.getAndIncrement()
            eng.deliverFetchError(requestId, err.message ?: "Fetch request failed")
            requestId.toString()
        }
    }

    fun fetchAbort(idStr: String) {
        val eng = engine ?: return
        try {
            val id = idStr.toIntOrNull() ?: return
            eng.nativeFetch.abort(id)
        } catch (err: Throwable) {
            Log.e(eng.logTag, "fetchAbort error", err)
        }
    }

    // ============ EventSource Methods ============

    fun eventSourceOpen(paramsJson: String): String {
        val eng = engine ?: return "-1"
        return try {
            val params = JSONObject(paramsJson)
            val url = params.optString("url")
            val withCredentials = params.optBoolean("withCredentials", false)
            eng.nativeEventSource.open(url, withCredentials).toString()
        } catch (err: Throwable) {
            Log.e(eng.logTag, "eventSourceOpen error", err)
            val id = eng.eventSourceIdGenerator.getAndIncrement()
            eng.deliverEventSourceError(id, err.message ?: "EventSource open failed")
            eng.deliverEventSourceClosed(id, err::class.java.simpleName)
            id.toString()
        }
    }

    fun eventSourceClose(idStr: String) {
        val eng = engine ?: return
        try {
            val id = idStr.toIntOrNull() ?: return
            eng.nativeEventSource.close(id)
        } catch (err: Throwable) {
            Log.e(eng.logTag, "eventSourceClose error", err)
        }
    }

    // ============ LocalStorage Methods ============

    fun localStorageGetItem(key: String): String? {
        val eng = engine ?: return null
        return try {
            val prefs = eng.applicationContext.getSharedPreferences("walletkit_localStorage", android.content.Context.MODE_PRIVATE)
            prefs.getString(key, null)
        } catch (err: Throwable) {
            Log.e(eng.logTag, "localStorageGetItem error", err)
            null
        }
    }

    fun localStorageSetItem(key: String, value: String) {
        val eng = engine ?: return
        try {
            val prefs = eng.applicationContext.getSharedPreferences("walletkit_localStorage", android.content.Context.MODE_PRIVATE)
            prefs.edit().putString(key, value).apply()
        } catch (err: Throwable) {
            Log.e(eng.logTag, "localStorageSetItem error", err)
        }
    }

    fun localStorageRemoveItem(key: String) {
        val eng = engine ?: return
        try {
            val prefs = eng.applicationContext.getSharedPreferences("walletkit_localStorage", android.content.Context.MODE_PRIVATE)
            prefs.edit().remove(key).apply()
        } catch (err: Throwable) {
            Log.e(eng.logTag, "localStorageRemoveItem error", err)
        }
    }

    fun localStorageClear() {
        val eng = engine ?: return
        try {
            val prefs = eng.applicationContext.getSharedPreferences("walletkit_localStorage", android.content.Context.MODE_PRIVATE)
            prefs.edit().clear().apply()
        } catch (err: Throwable) {
            Log.e(eng.logTag, "localStorageClear error", err)
        }
    }

    fun localStorageKey(index: Int): String? {
        val eng = engine ?: return null
        return try {
            val prefs = eng.applicationContext.getSharedPreferences("walletkit_localStorage", android.content.Context.MODE_PRIVATE)
            val keys = prefs.all.keys.toList()
            if (index >= 0 && index < keys.size) keys[index] else null
        } catch (err: Throwable) {
            Log.e(eng.logTag, "localStorageKey error", err)
            null
        }
    }

    fun localStorageLength(): Int {
        val eng = engine ?: return 0
        return try {
            val prefs = eng.applicationContext.getSharedPreferences("walletkit_localStorage", android.content.Context.MODE_PRIVATE)
            prefs.all.size
        } catch (err: Throwable) {
            Log.e(eng.logTag, "localStorageLength error", err)
            0
        }
    }
}
