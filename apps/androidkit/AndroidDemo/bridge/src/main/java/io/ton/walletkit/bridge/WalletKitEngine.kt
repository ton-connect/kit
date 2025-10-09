package io.ton.walletkit.bridge

import io.ton.walletkit.bridge.config.WalletKitBridgeConfig
import io.ton.walletkit.bridge.listener.WalletKitEngineListener
import io.ton.walletkit.bridge.model.WalletAccount
import io.ton.walletkit.bridge.model.WalletSession
import io.ton.walletkit.bridge.model.WalletState
import org.json.JSONArray
import org.json.JSONObject
import java.io.Closeable

/**
 * Abstraction over a runtime that can execute the WalletKit JavaScript bundle and expose
 * the wallet APIs to Android callers. Implementations may back the runtime with a WebView or
 * an embedded JavaScript engine such as QuickJS. Every implementation must provide the same
 * JSON-RPC surface as the historical [WalletKitBridge] class.
 *
 * **Auto-Initialization:**
 * All methods that require WalletKit initialization will automatically initialize the SDK
 * if it hasn't been initialized yet. This means calling [init] explicitly is optional -
 * you can call any method and initialization will happen automatically with default settings.
 * If you need custom configuration, call [init] with your config before other methods.
 */
interface WalletKitEngine {
    val kind: WalletKitEngineKind

    fun addListener(listener: WalletKitEngineListener): Closeable

    /**
     * Initialize WalletKit with custom configuration. This method is optional - if not called,
     * initialization will happen automatically on first use with default settings.
     *
     * @param config Configuration for the WalletKit SDK
     * @return JSONObject with initialization result
     */
    suspend fun init(config: WalletKitBridgeConfig = WalletKitBridgeConfig()): JSONObject

    suspend fun addWalletFromMnemonic(
        words: List<String>,
        version: String,
        network: String? = null,
    ): JSONObject

    suspend fun getWallets(): List<WalletAccount>

    suspend fun removeWallet(address: String): JSONObject

    suspend fun getWalletState(address: String): WalletState

    suspend fun getRecentTransactions(address: String, limit: Int = 10): JSONArray

    suspend fun handleTonConnectUrl(url: String): JSONObject

    suspend fun sendTransaction(
        walletAddress: String,
        recipient: String,
        amount: String,
        comment: String? = null,
    ): JSONObject

    suspend fun approveConnect(
        requestId: Any,
        walletAddress: String,
    ): JSONObject

    suspend fun rejectConnect(
        requestId: Any,
        reason: String? = null,
    ): JSONObject

    suspend fun approveTransaction(requestId: Any): JSONObject

    suspend fun rejectTransaction(
        requestId: Any,
        reason: String? = null,
    ): JSONObject

    suspend fun approveSignData(requestId: Any): JSONObject

    suspend fun rejectSignData(
        requestId: Any,
        reason: String? = null,
    ): JSONObject

    suspend fun listSessions(): List<WalletSession>

    suspend fun disconnectSession(sessionId: String? = null): JSONObject

    suspend fun destroy()

    /**
     * Test API: Inject a sign data request for testing purposes.
     * This simulates receiving a sign data request from a dApp and will trigger
     * the normal sign data flow including actual cryptographic signing.
     */
    suspend fun injectSignDataRequest(requestData: JSONObject): JSONObject
}

/**
 * Identifies which JavaScript runtime engine is being used.
 */
enum class WalletKitEngineKind {
    /**
     * WebView-based engine (recommended).
     * - 2x faster than QuickJS
     * - Actively maintained
     * - Production-ready
     */
    WEBVIEW,

    /**
     * QuickJS-based engine (deprecated).
     * @deprecated QuickJS is 2x slower than WebView and is no longer maintained.
     * Use WEBVIEW instead. See QUICKJS_DEPRECATION.md for details.
     */
    @Deprecated(
        message = "QuickJS is deprecated. Use WEBVIEW instead for 2x better performance.",
        replaceWith = ReplaceWith("WalletKitEngineKind.WEBVIEW"),
        level = DeprecationLevel.WARNING,
    )
    QUICKJS,
}
