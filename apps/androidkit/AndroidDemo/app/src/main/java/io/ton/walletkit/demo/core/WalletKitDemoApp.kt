package io.ton.walletkit.demo.core

import android.app.Application
import android.util.Log
import io.ton.walletkit.demo.data.storage.DemoAppStorage
import io.ton.walletkit.demo.data.storage.SecureDemoAppStorage
import io.ton.walletkit.domain.model.TONNetwork
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

        // Initialize TONWalletKit SDK
        applicationScope.launch {
            initializeSDK()
            _sdkInitialized.emit(true)
        }
    }

    private suspend fun initializeSDK() {
        Log.d(TAG, "Initializing SDK with network: ${TONNetwork.MAINNET}")
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
            apiClient = null, // Use default API URLs based on network
            features = listOf(
                TONWalletKitConfiguration.SendTransactionFeature(maxMessages = 4),
                TONWalletKitConfiguration.SignDataFeature(
                    types = listOf(SignDataType.TEXT, SignDataType.BINARY, SignDataType.CELL),
                ),
            ),
            storage = TONWalletKitConfiguration.Storage(persistent = true),
        )

        TONWalletKit.initialize(
            context = this,
            configuration = config,
            eventsHandler = object : TONBridgeEventsHandler {
                override fun handle(event: TONWalletKitEvent) {
                    _sdkEvents.tryEmit(event)
                }
            },
        )
    }

    private companion object {
        private const val TAG = "WalletKitDemoApp"
        private const val DEFAULT_MANIFEST_NAME = "Wallet"
        private const val DEFAULT_APP_NAME = "Wallet"
        private const val DEFAULT_MANIFEST_IMAGE_URL = "https://wallet.ton.org/icon.png"
        private const val DEFAULT_MANIFEST_ABOUT_URL = "https://wallet.ton.org"
        private const val DEFAULT_MANIFEST_UNIVERSAL_LINK = "https://wallet.ton.org/tc"
        private const val DEFAULT_BRIDGE_URL = "https://bridge.tonapi.io/bridge"
    }
}
