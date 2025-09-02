# iOS WalletKit - Native Swift Implementation

A native iOS implementation of TonWalletKit using Swift and SwiftUI, with a JavaScript bridge to the underlying WalletKit functionality.

## Architecture Overview

The new architecture reverses the original design:

### Before (WebView-based)
- **UI**: HTML/JavaScript running in WebView
- **Logic**: JavaScript WalletKit with Swift bridge for native features
- **Bridge**: Swift → JavaScript calls for UI updates

### After (Native Swift)
- **UI**: Native SwiftUI components
- **Logic**: Swift wrapper around JavaScript WalletKit
- **Bridge**: Swift → JavaScript calls for blockchain operations

## Project Structure

```
apps/ioskit/
├── src/
│   ├── walletkit/                      # Swift WalletKit wrapper library
│   │   ├── WalletKitSwift.swift        # Main Swift API
│   │   ├── WalletKitTypes.swift        # Swift type definitions
│   │   ├── WalletKitEngine.swift       # JavaScript bridge engine
│   │   └── SwiftUI/                    # Native UI components
│   │       ├── WalletKitView.swift     # Main interface
│   │       ├── WalletCard.swift        # Wallet display
│   │       ├── SessionCard.swift       # Session display
│   │       ├── RequestViews.swift      # Request handling
│   │       └── AddWalletView.swift     # Wallet creation
│   └── demo/                           # Demo application
│       ├── IOSWalletKitDemoApp.swift   # Main app entry point
│       ├── ContentView.swift           # Root view
│       └── Info.plist                  # App configuration
└── IOSKitDemo/                         # Xcode project (legacy)
```

## Components

### 1. WalletKit Swift Wrapper (`WalletKitSwift.swift`)

Main interface for wallet operations:

```swift
@MainActor
public class TonWalletKitSwift: ObservableObject {
    // Published properties for SwiftUI binding
    @Published public private(set) var wallets: [WalletInfo] = []
    @Published public private(set) var sessions: [SessionInfo] = []
    
    // Wallet management
    func addWallet(_ config: WalletConfig) async throws
    func removeWallet(_ wallet: WalletInfo) async throws
    
    // Session management  
    func disconnect(sessionId: String?) async throws
    func handleTonConnectUrl(_ url: String) async throws
    
    // Request handling
    func approveConnectRequest(_ event: ConnectRequestEvent, wallet: WalletInfo) async throws
    func approveTransactionRequest(_ event: TransactionRequestEvent) async throws -> TransactionResult
    func approveSignDataRequest(_ event: SignDataRequestEvent) async throws -> SignDataResult
}
```

### 2. JavaScript Bridge Engine (`WalletKitEngine.swift`)

Bridges Swift calls to JavaScript WalletKit:

- Creates hidden WebView for JavaScript execution
- Handles bidirectional communication between Swift and JavaScript
- Manages request/response lifecycle with async/await
- Processes events from JavaScript and forwards to Swift

### 3. SwiftUI Components

#### Main Interface (`WalletKitView.swift`)
- Primary wallet management interface
- Displays wallets and active sessions
- Handles TonConnect URL input and processing
- Manages request approval flows

#### Request Views (`RequestViews.swift`)
- `ConnectRequestView`: Handle dApp connection requests
- `TransactionRequestView`: Review and approve transactions
- `SignDataRequestView`: Review and approve data signing

#### Wallet Management
- `WalletCard.swift`: Display individual wallet information
- `AddWalletView.swift`: Import or generate new wallets

## Usage

### 1. Basic Setup

```swift
import SwiftUI

@main
struct MyWalletApp: App {
    var body: some Scene {
        WindowGroup {
            WalletKitView(config: WalletKitConfig(
                network: .mainnet,
                storage: .local,
                manifestUrl: "https://example.com/tonconnect-manifest.json"
            ))
        }
    }
}
```

### 2. Custom Integration

```swift
import SwiftUI

struct CustomWalletView: View {
    @StateObject private var walletKit = TonWalletKitSwift(config: config)
    
    var body: some View {
        VStack {
            // Your custom UI
            ForEach(walletKit.wallets) { wallet in
                Text(wallet.walletName)
            }
        }
        .task {
            try await walletKit.initialize()
        }
        .onReceive(walletKit.$wallets) { wallets in
            // React to wallet changes
        }
    }
}
```

### 3. Event Handling

```swift
walletKit.onConnectRequest = { request in
    // Handle connection request with custom UI
}

walletKit.onTransactionRequest = { request in
    // Handle transaction request with custom UI
}
```

## Configuration

### WalletKitConfig

```swift
WalletKitConfig(
    apiKey: "your-api-key",              // Optional: API key for enhanced features
    network: .mainnet,                   // .mainnet or .testnet
    storage: .local,                     // .local, .memory, or .custom("id")
    manifestUrl: "https://..."           // Your app's TonConnect manifest
)
```

### Storage Options

- `.local`: Uses device local storage (persistent)
- `.memory`: Uses in-memory storage (temporary)
- `.custom(id)`: Uses custom storage adapter

## TON Connect Integration

### URL Handling

The app can handle TonConnect URLs through:

1. **Manual Input**: Users can paste URLs in the app
2. **URL Schemes**: Configure your app to handle `tc://` URLs
3. **Universal Links**: Configure for `https://` TonConnect URLs

### Request Flow

1. **Connect Request**: dApp requests wallet connection
   - User selects wallet from available options
   - App shows requested permissions
   - User approves/rejects connection

2. **Transaction Request**: dApp requests transaction signature
   - App shows transaction details and fees
   - User reviews and approves/rejects
   - Transaction is signed and broadcasted

3. **Sign Data Request**: dApp requests data signing
   - App shows data to be signed
   - User reviews and approves/rejects
   - Data is signed with wallet private key

## Development

### Prerequisites

- iOS 15.0+
- Xcode 14+
- Swift 5.7+

### Building

1. Open the project in Xcode
2. Select your target device/simulator
3. Build and run

### Adding to Existing Project

1. Copy the `walletkit/` directory to your project
2. Add the files to your Xcode project
3. Import and use `WalletKitView` or `TonWalletKitSwift` directly

## Security Considerations

- **Mnemonic Storage**: Recovery phrases are stored securely in the Keychain
- **Bridge Communication**: All bridge communication is contained within the app
- **Network Requests**: TLS/SSL used for all network communication
- **Local WebView**: JavaScript execution is sandboxed in a local WebView

## Advantages of Native Architecture

1. **Better Performance**: Native UI is faster and more responsive
2. **Platform Integration**: Better iOS integration (haptics, notifications, etc.)
3. **Maintainability**: Easier to maintain Swift/SwiftUI code
4. **User Experience**: Native iOS look and feel
5. **Debugging**: Better debugging tools for Swift code
6. **Extensibility**: Easier to extend with custom features

## Migration from WebView Version

The native version maintains API compatibility while providing enhanced features:

- **Existing Features**: All WebView functionality is preserved
- **Enhanced UI**: Native iOS controls and interactions
- **Better Performance**: Improved response times and animations
- **iOS Integration**: Native share sheets, haptics, and system integration

## License

Same license as the parent WalletKit project.
