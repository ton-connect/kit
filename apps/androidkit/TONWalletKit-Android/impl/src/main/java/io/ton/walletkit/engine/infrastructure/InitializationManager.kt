package io.ton.walletkit.engine.infrastructure

import android.content.Context
import android.util.Log
import io.ton.walletkit.WalletKitBridgeException
import io.ton.walletkit.config.SignDataType
import io.ton.walletkit.config.TONWalletKitConfiguration
import io.ton.walletkit.internal.constants.BridgeMethodConstants
import io.ton.walletkit.internal.constants.JsonConstants
import io.ton.walletkit.internal.constants.LogConstants
import io.ton.walletkit.internal.constants.NetworkConstants
import io.ton.walletkit.internal.constants.WebViewConstants
import io.ton.walletkit.model.TONNetwork
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import org.json.JSONArray
import org.json.JSONObject

/**
 * Handles WalletKit initialisation and configuration state.
 *
 * Responsibilities:
 * * Track whether the bridge has been initialised.
 * * Build the payload passed to the JavaScript `init` method.
 * * Persist network-related properties for later use by the engine.
 * * Maintain the persistent storage flag used by [StorageManager].
 *
 * @suppress Internal component. Use through [WebViewWalletKitEngine].
 */
internal class InitializationManager(
    context: Context,
    private val rpcClient: BridgeRpcClient,
) {
    private val appContext = context.applicationContext
    private val walletKitInitMutex = Mutex()

    @Volatile private var isWalletKitInitialized: Boolean = false

    @Volatile private var persistentStorageEnabled: Boolean = true

    @Volatile private var currentNetwork: String = NetworkConstants.DEFAULT_NETWORK

    @Volatile private var apiBaseUrl: String = NetworkConstants.DEFAULT_TESTNET_API_URL

    @Volatile private var tonApiKey: String? = null

    private var pendingInitConfig: TONWalletKitConfiguration? = null

    suspend fun initialize(configuration: TONWalletKitConfiguration) {
        walletKitInitMutex.withLock {
            if (!isWalletKitInitialized) {
                pendingInitConfig = configuration
            }
        }
        ensureInitialized(configuration)
    }

    suspend fun ensureInitialized(configuration: TONWalletKitConfiguration? = null) {
        if (isWalletKitInitialized) {
            return
        }

        walletKitInitMutex.withLock {
            if (isWalletKitInitialized) {
                return@withLock
            }

            val effectiveConfig = configuration ?: pendingInitConfig ?: throw WalletKitBridgeException(ERROR_INIT_CONFIG_REQUIRED)
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

    fun isInitialized(): Boolean = isWalletKitInitialized

    fun isPersistentStorageEnabled(): Boolean = persistentStorageEnabled

    fun currentNetwork(): String = currentNetwork

    fun apiBaseUrl(): String = apiBaseUrl

    fun updateNetwork(network: String?) {
        if (!network.isNullOrBlank()) {
            currentNetwork = network
        }
    }

    fun updateApiBaseUrl(url: String?) {
        if (!url.isNullOrBlank()) {
            apiBaseUrl = url
        }
    }

    fun tonApiKey(): String? = tonApiKey

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
        rpcClient.call(BridgeMethodConstants.METHOD_INIT, payload)

        Log.d(TAG, "WalletKit initialized. Event listeners will be set up on-demand.")
    }

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

    private companion object {
        private const val TAG = LogConstants.TAG_WEBVIEW_ENGINE
        private const val ERROR_WALLETKIT_AUTO_INIT_FAILED = "WalletKit auto-initialization failed"
        private const val ERROR_FAILED_AUTO_INIT_WALLETKIT = "Failed to auto-initialize WalletKit: "
        private const val ERROR_FAILED_GET_APP_VERSION = "Failed to get app version, using default"
        private const val ERROR_FAILED_GET_APP_NAME = "Failed to get app name, using package name"
        private const val ERROR_INIT_CONFIG_REQUIRED = "TONWalletKit.initialize() must be called before using the SDK."
        private const val DEFAULT_MAX_MESSAGES = 4
        private val DEFAULT_SIGN_TYPES = listOf(SignDataType.TEXT, SignDataType.BINARY, SignDataType.CELL)
    }
}
