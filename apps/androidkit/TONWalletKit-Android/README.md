# Android TONWalletKit

Kotlin library providing TON wallet capabilities for Android.

- Minimum: Android 7.0 (API 24)

## Installation

Add to your `build.gradle.kts`:

```kotlin
dependencies {
    implementation("io.ton:walletkit:1.0.0")
}
```

## Quick start

#### Initialize TONWalletKit:
```kotlin
import io.ton.walletkit.presentation.TONWalletKit
import io.ton.walletkit.presentation.config.TONWalletKitConfiguration
import io.ton.walletkit.presentation.config.SignDataType
import io.ton.walletkit.domain.model.TONNetwork

// Create configuration that fits your app
val configuration = TONWalletKitConfiguration(
    network = TONNetwork.TESTNET,
    walletManifest = TONWalletKitConfiguration.Manifest(
        name = "MyTONWallet",
        appName = "MyTONWalletIdentifier",
        imageUrl = "https://example.com/image.png",
        aboutUrl = "https://example.com/about",
        universalLink = "https://example.com/universal-link",
        bridgeUrl = "https://bridge.tonapi.io/bridge"
    ),
    bridge = TONWalletKitConfiguration.Bridge(bridgeUrl = "https://bridge.tonapi.io/bridge"),
    apiClient = TONWalletKitConfiguration.APIClient(url = <api_url>, key = <api_key>),
    features = listOf(
        TONWalletKitConfiguration.SendTransactionFeature(maxMessages = 1),
        TONWalletKitConfiguration.SignDataFeature(types = listOf(SignDataType.TEXT, SignDataType.BINARY, SignDataType.CELL))
    ),
    storage = TONWalletKitConfiguration.Storage(persistent = true)
)

// Initialize the kit
val kit = TONWalletKit.initialize(
    context = context,
    configuration = configuration
)
```

#### Add events listener:
```kotlin
import io.ton.walletkit.presentation.listener.TONBridgeEventsHandler
import io.ton.walletkit.presentation.event.TONWalletKitEvent

val eventsHandler = object : TONBridgeEventsHandler {
    override fun handle(event: TONWalletKitEvent) {
        println("TONWalletKit event: $event")
    }
}

kit.addEventsHandler(eventsHandler)
```

#### Remove events listener:
```kotlin
kit.removeEventsHandler(eventsHandler)
```

#### Create and add a v5r1 wallet using mnemonic:
```kotlin
import io.ton.walletkit.domain.model.TONWalletData

val mnemonic = kit.createMnemonic()
val walletData = TONWalletData(
    mnemonic = mnemonic,
    name = "My Wallet",
    version = "v5r1",
    network = TONNetwork.TESTNET
)
val wallet = kit.addWallet(walletData)
```

#### Read wallet address and balance:
```kotlin
val address = wallet.address
val balance = wallet.balance()

println("Address: ${address ?: "<none>"}")
println("Balance: ${balance ?: "<unknown>"}")
```

#### Handle TON Connect deep links:
```kotlin
// Connect to a dApp via QR code or deep link
wallet.connect("tc://...")
```

#### Integrate WebView with TonConnect:
```kotlin
import android.webkit.WebView
import io.ton.walletkit.presentation.browser.injectTonConnect

val webView = WebView(context).apply {
    settings.javaScriptEnabled = true
    settings.domStorageEnabled = true
    
    // Inject TonConnect bridge - connects WebView dApps to your wallet
    injectTonConnect(kit)
    
    loadUrl("https://your-dapp-url.com")
}
```

#### Get wallet transactions:
```kotlin
val transactions = wallet.transactions(limit = 10)
transactions.forEach { tx ->
    println("Hash: ${tx.hash}, Amount: ${tx.amount}")
}
```

#### Get active sessions:
```kotlin
val sessions = wallet.sessions()
sessions.forEach { session ->
    println("dApp: ${session.dAppName}, URL: ${session.dAppUrl}")
}
```

#### Disconnect a session:
```kotlin
import io.ton.walletkit.presentation.extensions.disconnect

val sessions = wallet.sessions()
sessions.firstOrNull()?.disconnect()
```

#### Send a transaction:
```kotlin
import io.ton.walletkit.domain.model.TONTransferParams

// Create transfer parameters
val params = TONTransferParams(
    toAddress = "EQD...",
    amount = "1000000000", // 1 TON in nanotons
    comment = "Payment"
)

// Create transaction content
val transactionContent = wallet.createTransferTonTransaction(params)

// Trigger transaction approval flow
kit.handleNewTransaction(wallet, transactionContent)
```

#### Remove wallet:
```kotlin
wallet.remove()
```

#### Get all wallets:
```kotlin
val wallets = kit.getWallets()
```

#### Add wallet with external signer:
```kotlin
import io.ton.walletkit.domain.model.WalletSigner

// Derive public key from mnemonic (or get from remote signing service)
val publicKey = TONWallet.derivePublicKey(kit, mnemonic)

val signer = object : WalletSigner {
    override val publicKey: String = publicKey
    
    override suspend fun sign(data: ByteArray): ByteArray {
        // Show confirmation dialog and forward to external signing service
        // Note: This can sign both transactions and arbitrary data.
        // For hardware wallets (Ledger, etc.) that only sign transactions,
        // use a different integration approach at the adapter level.
        return signature
    }
}

val wallet = TONWallet.addWithSigner(
    kit = kit,
    signer = signer,
    version = "v4r2",
    network = TONNetwork.MAINNET
)
```

#### Clean up when done:
```kotlin
// Remove all event handlers and release resources
kit.destroy()
```

#### Notes
- [Demo app](../../AndroidDemo) shows a more complete integration.
