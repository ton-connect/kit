package io.ton.walletkit.bridge

import io.ton.walletkit.config.TONWalletKitConfiguration
import io.ton.walletkit.event.TONWalletKitEvent
import io.ton.walletkit.listener.TONBridgeEventsHandler
import io.ton.walletkit.model.TONNetwork
import java.util.concurrent.CopyOnWriteArrayList

val NoopEventsHandler: TONBridgeEventsHandler =
    object : TONBridgeEventsHandler {
        override fun handle(event: TONWalletKitEvent) = Unit
    }

fun testWalletKitConfiguration(
    network: TONNetwork = TONNetwork.TESTNET,
    persistent: Boolean = true,
    bridgeUrl: String = "https://bridge.tonapi.io/bridge",
    apiUrl: String? = null,
    features: List<TONWalletKitConfiguration.Feature> = emptyList(),
): TONWalletKitConfiguration {
    return TONWalletKitConfiguration(
        network = network,
        walletManifest =
        TONWalletKitConfiguration.Manifest(
            name = "Test Wallet",
            appName = "Wallet",
            imageUrl = "https://example.com/icon.png",
            aboutUrl = "https://example.com",
            universalLink = "https://example.com/app",
            bridgeUrl = bridgeUrl,
        ),
        bridge = TONWalletKitConfiguration.Bridge(bridgeUrl = bridgeUrl),
        apiClient = apiUrl?.let { TONWalletKitConfiguration.APIClient(url = it, key = "test-key") },
        features = features,
        storage = TONWalletKitConfiguration.Storage(persistent = persistent),
    )
}

class RecordingEventsHandler : TONBridgeEventsHandler {
    private val _events = CopyOnWriteArrayList<TONWalletKitEvent>()
    val events: List<TONWalletKitEvent>
        get() = _events

    override fun handle(event: TONWalletKitEvent) {
        _events += event
    }
}

fun compositeEventsHandler(vararg handlers: TONBridgeEventsHandler): TONBridgeEventsHandler =
    object : TONBridgeEventsHandler {
        override fun handle(event: TONWalletKitEvent) {
            handlers.forEach { it.handle(event) }
        }
    }
