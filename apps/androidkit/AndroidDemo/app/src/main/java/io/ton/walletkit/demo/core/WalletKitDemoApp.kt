package io.ton.walletkit.demo.core

import android.app.Application
import android.util.Log
import io.ton.walletkit.demo.data.storage.DemoAppStorage
import io.ton.walletkit.demo.data.storage.SecureDemoAppStorage
import io.ton.walletkit.domain.model.TONNetwork
import io.ton.walletkit.domain.model.TONWalletData
import io.ton.walletkit.presentation.TONWalletKit
import io.ton.walletkit.presentation.config.SignDataType
import io.ton.walletkit.presentation.config.TONWalletKitConfiguration
import io.ton.walletkit.presentation.event.TONWalletKitEvent
import io.ton.walletkit.presentation.listener.TONBridgeEventsHandler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch

class WalletKitDemoApp : Application() {

    // Application-level coroutine scope
    private val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    /**
     * Demo app storage for wallet metadata and user preferences.
     * Note: Wallet data (mnemonics) are managed by SDK's internal persistent storage.
     */
    val storage: DemoAppStorage by lazy {
        SecureDemoAppStorage(this)
    }

    /**
     * Shared flow for SDK events to be consumed by ViewModel.
     */
    private val _sdkEvents = MutableSharedFlow<TONWalletKitEvent>(extraBufferCapacity = 10)
    val sdkEvents = _sdkEvents.asSharedFlow()

    /**
     * State flow for SDK initialization status.
     */
    private val _sdkInitialized = MutableSharedFlow<Boolean>(replay = 1)
    val sdkInitialized = _sdkInitialized.asSharedFlow()

    override fun onCreate() {
        super.onCreate()

        // Initialize TONWalletKit SDK and add event handler
        applicationScope.launch {
            try {
                val kit = TONWalletKitHelper.mainnet(this@WalletKitDemoApp)
                
                // CRITICAL: Load and add wallets BEFORE setting up event listeners
                // This ensures that when events are replayed (which happens when the first
                // event handler is added), the wallets are already available in the SDK
                // for event approval/rejection operations.
                loadAndAddStoredWallets(kit)
                
                // Add event handler (this triggers setEventsListeners() and event replay)
                kit.addEventsHandler(object : TONBridgeEventsHandler {
                    override fun handle(event: TONWalletKitEvent) {
                        _sdkEvents.tryEmit(event)
                    }
                })
                
                _sdkInitialized.emit(true)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to initialize SDK", e)
            }
        }
    }
    
    /**
     * Load wallets from encrypted storage and add them to the SDK.
     * This must be done BEFORE adding event handlers to ensure wallets are available
     * when replayed events are processed.
     */
    private suspend fun loadAndAddStoredWallets(kit: TONWalletKit) {
        try {
            // Get all stored wallet records
            val storage = getSharedPreferences("wallet_storage", MODE_PRIVATE)
            val walletDataJson = storage.getString("wallets", "[]") ?: "[]"
            
            // Skip if no wallets stored (empty list is fine)
            if (walletDataJson == "[]") {
                Log.d(TAG, "No stored wallets to load")
                return
            }
            
            val walletDataList = kotlinx.serialization.json.Json.decodeFromString<List<WalletDataRecord>>(walletDataJson)
            
            Log.d(TAG, "Loading ${walletDataList.size} stored wallets into SDK")
            
            // Add each wallet to the SDK
            for (walletRecord in walletDataList) {
                try {
                    // Convert mnemonic string to list of words
                    val mnemonicWords = walletRecord.mnemonic.split(" ").filter { it.isNotBlank() }
                    
                    // Convert network string to TONNetwork enum
                    val network = when (walletRecord.network.lowercase()) {
                        "mainnet", "-239" -> TONNetwork.MAINNET
                        "testnet", "-3" -> TONNetwork.TESTNET
                        else -> TONNetwork.MAINNET
                    }
                    
                    val walletData = TONWalletData(
                        mnemonic = mnemonicWords,
                        name = "", // Name is stored separately in demo app storage
                        network = network,
                        version = walletRecord.version
                    )
                    kit.addWallet(walletData)
                    Log.d(TAG, "Added wallet to SDK: ${walletRecord.address}")
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to add wallet ${walletRecord.address} to SDK", e)
                }
            }
            
            Log.d(TAG, "Finished loading wallets into SDK")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load stored wallets", e)
        }
    }
    
    @kotlinx.serialization.Serializable
    private data class WalletDataRecord(
        val mnemonic: String,
        val address: String,
        val network: String,
        val version: String
    )

    private companion object {
        private const val TAG = "WalletKitDemoApp"
    }
}

/**
 * Helper to get cached TONWalletKit instance (matches iOS pattern).
 * Similar to iOS extension on TONWalletKit with static mainnet() function.
 */
object TONWalletKitHelper {
    private var _mainnet: TONWalletKit? = null

    suspend fun mainnet(application: Application): TONWalletKit {
        _mainnet?.let { return it }

        val config = TONWalletKitConfiguration(
            network = TONNetwork.MAINNET,
            walletManifest = TONWalletKitConfiguration.Manifest(
                name = DEFAULT_MANIFEST_NAME,
                appName = DEFAULT_APP_NAME,
                imageUrl = DEFAULT_MANIFEST_IMAGE_URL,
                aboutUrl = DEFAULT_MANIFEST_ABOUT_URL,
                universalLink = DEFAULT_MANIFEST_UNIVERSAL_LINK,
                bridgeUrl = DEFAULT_BRIDGE_URL,
            ),
            bridge = TONWalletKitConfiguration.Bridge(
                bridgeUrl = DEFAULT_BRIDGE_URL,
            ),
            apiClient = null,
            features = listOf(
                TONWalletKitConfiguration.SendTransactionFeature(maxMessages = 4),
                TONWalletKitConfiguration.SignDataFeature(
                    types = listOf(SignDataType.TEXT, SignDataType.BINARY, SignDataType.CELL),
                ),
            ),
            storage = TONWalletKitConfiguration.Storage(persistent = true),
        )

        val kit = TONWalletKit.initialize(application, config)
        _mainnet = kit
        return kit
    }

    /**
     * Clear the cached instance (for testing or logout scenarios).
     */
    suspend fun clearMainnet() {
        _mainnet?.destroy()
        _mainnet = null
    }

    private const val DEFAULT_MANIFEST_NAME = "Wallet"
    private const val DEFAULT_APP_NAME = "Wallet"
    private const val DEFAULT_MANIFEST_IMAGE_URL = "https://wallet.ton.org/icon.png"
    private const val DEFAULT_MANIFEST_ABOUT_URL = "https://wallet.ton.org"
    private const val DEFAULT_MANIFEST_UNIVERSAL_LINK = "https://wallet.ton.org/tc"
    private const val DEFAULT_BRIDGE_URL = "https://bridge.tonapi.io/bridge"
}
