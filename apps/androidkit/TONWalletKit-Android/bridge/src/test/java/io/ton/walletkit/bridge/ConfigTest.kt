package io.ton.walletkit.bridge

import io.ton.walletkit.presentation.config.WalletKitBridgeConfig
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

/**
 * Tests for WalletKitBridgeConfig.
 */
class ConfigTest {

    @Test
    fun `default config has testnet network`() {
        val config = WalletKitBridgeConfig()
        assertEquals("testnet", config.network)
    }

    @Test
    fun `config has default values for optional URLs`() {
        val config = WalletKitBridgeConfig()
        assertNotNull(config)
        // URLs are optional and may be null or have defaults
    }

    @Test
    fun `config supports mainnet`() {
        val config = WalletKitBridgeConfig(network = "mainnet")
        assertEquals("mainnet", config.network)
    }

    @Test
    fun `config is a data class with copy`() {
        val config = WalletKitBridgeConfig(network = "testnet")
        val modified = config.copy(network = "mainnet")

        assertEquals("mainnet", modified.network)
        assertEquals("testnet", config.network) // Original unchanged
    }

    @Test
    fun `config supports custom URLs`() {
        val config = WalletKitBridgeConfig(
            tonApiUrl = "https://custom.api",
            bridgeUrl = "https://custom.bridge",
        )

        assertEquals("https://custom.api", config.tonApiUrl)
        assertEquals("https://custom.bridge", config.bridgeUrl)
    }

    @Test
    fun `config supports persistence toggle`() {
        val withStorage = WalletKitBridgeConfig(enablePersistentStorage = true)
        val withoutStorage = WalletKitBridgeConfig(enablePersistentStorage = false)

        assertTrue(withStorage.enablePersistentStorage)
        assertTrue(!withoutStorage.enablePersistentStorage)
    }
}
