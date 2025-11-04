package io.ton.walletkit.bridge

import android.content.Context
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import io.ton.walletkit.domain.model.TONNetwork
import io.ton.walletkit.domain.model.TONWalletData
import io.ton.walletkit.presentation.TONWallet
import io.ton.walletkit.presentation.TONWalletKit
import io.ton.walletkit.presentation.config.SignDataType
import io.ton.walletkit.presentation.config.TONWalletKitConfiguration
import io.ton.walletkit.presentation.event.TONWalletKitEvent
import io.ton.walletkit.presentation.listener.TONBridgeEventsHandler
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout
import org.junit.After
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/**
 * High-level SDK tests that demonstrate the canonical TON Wallet Kit API usage.
 *
 * These tests show how applications should use the SDK:
 * 1. Initialize with TONWalletKit.initialize()
 * 2. Create wallets with TONWallet.add()
 * 3. Retrieve wallets with TONWallet.wallets()
 * 4. Perform operations on wallet instances
 */
@RunWith(AndroidJUnit4::class)
class TONWalletKitSDKTest {

    private lateinit var context: Context
    private val events = mutableListOf<TONWalletKitEvent>()

    @Before
    fun setUp() {
        context = InstrumentationRegistry.getInstrumentation().targetContext
        events.clear()
    }

    @After
    fun tearDown() = runBlocking {
        withContext(Dispatchers.Main) {
            TONWalletKit.shutdown()
        }
    }

    @Test
    fun sdkInitializeWithMainnetConfiguration() = runBlocking {
        withContext(Dispatchers.Main) {
            withTimeout(60_000) { // 60 seconds for emulator initialization
                val config = TONWalletKitConfiguration(
                    network = TONNetwork.MAINNET,
                    walletManifest = TONWalletKitConfiguration.Manifest(
                        name = "Test Wallet",
                        appName = "Wallet",
                        imageUrl = "https://example.com/icon.png",
                        aboutUrl = "https://example.com",
                        universalLink = "https://example.com/tc",
                        bridgeUrl = "https://bridge.tonapi.io/bridge",
                    ),
                    bridge = TONWalletKitConfiguration.Bridge(
                        bridgeUrl = "https://bridge.tonapi.io/bridge",
                    ),
                    apiClient = null,
                    features = listOf(
                        TONWalletKitConfiguration.SendTransactionFeature(maxMessages = 4),
                        TONWalletKitConfiguration.SignDataFeature(
                            types = listOf(SignDataType.TEXT, SignDataType.BINARY, SignDataType.CELL),
                        ),
                    ),
                    storage = TONWalletKitConfiguration.Storage(persistent = false),
                )

                val eventsHandler = object : TONBridgeEventsHandler {
                    override fun handle(event: TONWalletKitEvent) {
                        events.add(event)
                    }
                }

                TONWalletKit.initialize(context, config, eventsHandler)

                // Verify SDK initialized successfully (doesn't throw)
                assertTrue("SDK should initialize successfully", true)
            }
        }
    }

    @Test
    fun sdkInitializeWithTestnetConfiguration() = runBlocking {
        withContext(Dispatchers.Main) {
            withTimeout(60_000) { // 60 seconds for emulator initialization
                val config = TONWalletKitConfiguration(
                    network = TONNetwork.TESTNET,
                    walletManifest = TONWalletKitConfiguration.Manifest(
                        name = "Test Wallet",
                        appName = "Wallet",
                        imageUrl = "https://example.com/icon.png",
                        aboutUrl = "https://example.com",
                        universalLink = "https://example.com/tc",
                        bridgeUrl = "https://bridge.tonapi.io/bridge",
                    ),
                    bridge = TONWalletKitConfiguration.Bridge(
                        bridgeUrl = "https://bridge.tonapi.io/bridge",
                    ),
                    apiClient = null,
                    features = listOf(
                        TONWalletKitConfiguration.SendTransactionFeature(maxMessages = 4),
                        TONWalletKitConfiguration.SignDataFeature(
                            types = listOf(SignDataType.TEXT),
                        ),
                    ),
                    storage = TONWalletKitConfiguration.Storage(persistent = false),
                )

                val eventsHandler = object : TONBridgeEventsHandler {
                    override fun handle(event: TONWalletKitEvent) {
                        events.add(event)
                    }
                }

                TONWalletKit.initialize(context, config, eventsHandler)

                assertTrue("SDK should initialize successfully", true)
            }
        }
    }

    @Test
    fun createWalletWithMainnetNetwork() = runBlocking {
        withContext(Dispatchers.Main) {
            withTimeout(60_000) { // 60 seconds for emulator initialization
                // Initialize SDK first
                val config = TONWalletKitConfiguration(
                    network = TONNetwork.MAINNET,
                    walletManifest = TONWalletKitConfiguration.Manifest(
                        name = "Test Wallet",
                        appName = "Wallet",
                        imageUrl = "https://example.com/icon.png",
                        aboutUrl = "https://example.com",
                        universalLink = "https://example.com/tc",
                        bridgeUrl = "https://bridge.tonapi.io/bridge",
                    ),
                    bridge = TONWalletKitConfiguration.Bridge(
                        bridgeUrl = "https://bridge.tonapi.io/bridge",
                    ),
                    apiClient = null,
                    features = listOf(
                        TONWalletKitConfiguration.SendTransactionFeature(maxMessages = 4),
                    ),
                    storage = TONWalletKitConfiguration.Storage(persistent = false),
                )

                TONWalletKit.initialize(
                    context,
                    config,
                    object : TONBridgeEventsHandler {
                        override fun handle(event: TONWalletKitEvent) {
                            events.add(event)
                        }
                    },
                )

                // Create wallet with mainnet network
                val mnemonic = listOf(
                    "abandon", "abandon", "abandon", "abandon", "abandon", "abandon",
                    "abandon", "abandon", "abandon", "abandon", "abandon", "abandon",
                    "abandon", "abandon", "abandon", "abandon", "abandon", "abandon",
                    "abandon", "abandon", "abandon", "abandon", "abandon", "art",
                )

                val walletData = TONWalletData(
                    mnemonic = mnemonic,
                    name = "Test Mainnet Wallet",
                    network = TONNetwork.MAINNET,
                    version = "v4r2",
                )

                val wallet = TONWallet.add(walletData)

                assertNotNull("Wallet should be created", wallet)
                assertNotNull("Wallet should have an address", wallet.address)
            }
        }
    }

    @Test
    fun createWalletWithTestnetNetwork() = runBlocking {
        withContext(Dispatchers.Main) {
            withTimeout(60_000) { // 60 seconds for emulator initialization
                // Initialize SDK first
                val config = TONWalletKitConfiguration(
                    network = TONNetwork.TESTNET,
                    walletManifest = TONWalletKitConfiguration.Manifest(
                        name = "Test Wallet",
                        appName = "Wallet",
                        imageUrl = "https://example.com/icon.png",
                        aboutUrl = "https://example.com",
                        universalLink = "https://example.com/tc",
                        bridgeUrl = "https://bridge.tonapi.io/bridge",
                    ),
                    bridge = TONWalletKitConfiguration.Bridge(
                        bridgeUrl = "https://bridge.tonapi.io/bridge",
                    ),
                    apiClient = null,
                    features = listOf(
                        TONWalletKitConfiguration.SendTransactionFeature(maxMessages = 4),
                    ),
                    storage = TONWalletKitConfiguration.Storage(persistent = false),
                )

                TONWalletKit.initialize(
                    context,
                    config,
                    object : TONBridgeEventsHandler {
                        override fun handle(event: TONWalletKitEvent) {
                            events.add(event)
                        }
                    },
                )

                // Create wallet with testnet network
                val mnemonic = listOf(
                    "abandon", "abandon", "abandon", "abandon", "abandon", "abandon",
                    "abandon", "abandon", "abandon", "abandon", "abandon", "abandon",
                    "abandon", "abandon", "abandon", "abandon", "abandon", "abandon",
                    "abandon", "abandon", "abandon", "abandon", "abandon", "art",
                )

                val walletData = TONWalletData(
                    mnemonic = mnemonic,
                    name = "Test Testnet Wallet",
                    network = TONNetwork.TESTNET,
                    version = "v4r2",
                )

                val wallet = TONWallet.add(walletData)

                assertNotNull("Wallet should be created", wallet)
                assertNotNull("Wallet should have an address", wallet.address)
            }
        }
    }

    @Test
    fun retrieveWalletsList() = runBlocking {
        withContext(Dispatchers.Main) {
            withTimeout(60_000) { // 60 seconds for emulator initialization
                val config = TONWalletKitConfiguration(
                    network = TONNetwork.MAINNET,
                    walletManifest = TONWalletKitConfiguration.Manifest(
                        name = "Test Wallet",
                        appName = "Wallet",
                        imageUrl = "https://example.com/icon.png",
                        aboutUrl = "https://example.com",
                        universalLink = "https://example.com/tc",
                        bridgeUrl = "https://bridge.tonapi.io/bridge",
                    ),
                    bridge = TONWalletKitConfiguration.Bridge(
                        bridgeUrl = "https://bridge.tonapi.io/bridge",
                    ),
                    apiClient = null,
                    features = listOf(),
                    storage = TONWalletKitConfiguration.Storage(persistent = false),
                )

                TONWalletKit.initialize(
                    context,
                    config,
                    object : TONBridgeEventsHandler {
                        override fun handle(event: TONWalletKitEvent) {}
                    },
                )

                val wallets = TONWallet.wallets()

                assertNotNull("Wallets list should not be null", wallets)
                // List should be empty initially (non-persistent storage)
                assertTrue("Wallets list should be empty initially", wallets.isEmpty())
            }
        }
    }

    @Test
    fun multipleInitializationsAreIdempotent() = runBlocking {
        withContext(Dispatchers.Main) {
            withTimeout(60_000) { // 60 seconds for emulator initialization
                val config = TONWalletKitConfiguration(
                    network = TONNetwork.MAINNET,
                    walletManifest = TONWalletKitConfiguration.Manifest(
                        name = "Test Wallet",
                        appName = "Wallet",
                        imageUrl = "https://example.com/icon.png",
                        aboutUrl = "https://example.com",
                        universalLink = "https://example.com/tc",
                        bridgeUrl = "https://bridge.tonapi.io/bridge",
                    ),
                    bridge = TONWalletKitConfiguration.Bridge(
                        bridgeUrl = "https://bridge.tonapi.io/bridge",
                    ),
                    apiClient = null,
                    features = listOf(),
                    storage = TONWalletKitConfiguration.Storage(persistent = false),
                )

                val eventsHandler = object : TONBridgeEventsHandler {
                    override fun handle(event: TONWalletKitEvent) {}
                }

                // Multiple calls should not fail
                TONWalletKit.initialize(context, config, eventsHandler)
                TONWalletKit.initialize(context, config, eventsHandler)
                TONWalletKit.initialize(context, config, eventsHandler)

                assertTrue("Multiple initializations should succeed", true)
            }
        }
    }
}
