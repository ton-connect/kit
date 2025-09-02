# IOSKitDemo - Native WalletKit Implementation

This project has been updated to use the **new native WalletKit** instead of the previous WebView-based approach.

## 🔄 What Changed

### Before (WebView-based)
- Used `TonConnectBridge` with WebView
- JavaScript-based wallet operations
- Complex bridge communication layer
- HTML/CSS UI in WebView

### After (Native Swift)
- Uses `TonWalletKitSwift` with native SwiftUI
- Direct Swift API for wallet operations
- Clean Swift-to-JavaScript bridge for blockchain operations only
- Native iOS UI with SwiftUI components

## 📂 Project Structure

```
IOSKitDemo/
├── IOSKitDemo/
│   ├── WalletKit/                      # Native WalletKit library
│   │   ├── WalletKitSwift.swift        # Main Swift API
│   │   ├── WalletKitTypes.swift        # Swift type definitions
│   │   ├── WalletKitEngine.swift       # JavaScript bridge engine
│   │   └── SwiftUI/                    # Native UI components
│   │       ├── WalletKitView.swift     # Main wallet interface
│   │       ├── WalletCard.swift        # Wallet display card
│   │       ├── SessionCard.swift       # Session display card
│   │       ├── RequestViews.swift      # Request approval views
│   │       └── AddWalletView.swift     # Wallet creation flow
│   ├── IOSKitDemoApp.swift            # Updated app entry point
│   ├── ContentView.swift              # Updated root view
│   ├── Info.plist                     # Updated configuration
│   ├── Legacy/                        # Old files (preserved for reference)
│   │   ├── TonConnectBridge.swift     # Old WebView bridge
│   │   ├── WalletKitIntegration.swift # Old integration layer
│   │   ├── BridgeTypes.swift          # Old type definitions
│   │   └── index.html                 # Old WebView HTML
│   └── Assets.xcassets/               # App assets
├── IOSKitDemoTests/                   # Unit tests
└── IOSKitDemoUITests/                 # UI tests
```

## 🛠 Setting Up the Project

### 1. Open in Xcode
```bash
open IOSKitDemo.xcodeproj
```

### 2. Add WalletKit Files to Project
1. Right-click on your project in Xcode
2. Select "Add Files to 'IOSKitDemo'"
3. Navigate to the `WalletKit` folder
4. Select all files and folders
5. Make sure "Add to target" includes your app target
6. Click "Add"

### 3. Add Required Frameworks
1. Select your project target
2. Go to "General" → "Frameworks and Libraries"
3. Add these frameworks:
   - `WebKit.framework` (Required for JavaScript bridge)
   - `Combine.framework` (Usually included by default)

### 4. Configure Build Settings
1. Set **Minimum Deployment Target** to iOS 15.0+
2. Ensure **Swift Language Version** is Swift 5.7+

### 5. Build and Run
- Build: `⌘ + B`
- Run: `⌘ + R`

## 🚀 Key Features

### Native SwiftUI Interface
- **Wallet Management**: Create, import, and manage multiple wallets
- **Session Management**: View and manage dApp connections
- **Request Handling**: Native UI for connection, transaction, and signing requests
- **QR Code Scanning**: Built-in QR code scanner for TonConnect URLs

### WalletKit Integration
- **Swift API**: Clean, type-safe Swift interface
- **Async/Await**: Modern Swift concurrency support
- **Combine Integration**: Reactive programming with `@Published` properties
- **Error Handling**: Comprehensive error types and handling

### Security Features
- **Secure Storage**: Keychain integration for sensitive data
- **Biometric Authentication**: Face ID/Touch ID support
- **Network Security**: TLS 1.2+ enforcement for all connections
- **URL Validation**: Comprehensive TonConnect URL validation

## 📱 Usage Examples

### Basic Setup
```swift
import SwiftUI

@main
struct MyWalletApp: App {
    var body: some Scene {
        WindowGroup {
            WalletKitView(config: WalletKitConfig(
                network: .mainnet,
                storage: .local,
                manifestUrl: "https://your-app.com/manifest.json"
            ))
        }
    }
}
```

### Custom Integration
```swift
struct CustomWalletView: View {
    @StateObject private var walletKit = TonWalletKitSwift(config: config)
    
    var body: some View {
        VStack {
            // Your custom UI
            ForEach(walletKit.wallets, id: \.id) { wallet in
                WalletRowView(wallet: wallet)
            }
        }
        .task {
            try? await walletKit.initialize()
        }
    }
}
```

### Event Handling
```swift
// Setup event handlers
walletKit.onConnectRequest = { request in
    // Handle connection request with custom UI
    showConnectRequestModal(request)
}

walletKit.onTransactionRequest = { request in
    // Handle transaction request
    showTransactionReviewModal(request)
}
```

## 🔗 TonConnect Integration

### URL Schemes
The app supports these URL schemes:
- `tc://` - TonConnect protocol
- `ton-connect://` - Alternative TonConnect scheme
- `tonconnect://` - Short TonConnect scheme
- `tonwallet://` - App-specific scheme

### Deep Link Handling
```swift
.onOpenURL { url in
    Task {
        try await walletKit.handleTonConnectUrl(url.absoluteString)
    }
}
```

### dApp Manifest
Create a `tonconnect-manifest.json` file for your app:
```json
{
    "url": "https://your-app.com",
    "name": "Your Wallet",
    "iconUrl": "https://your-app.com/icon.png",
    "termsOfServiceUrl": "https://your-app.com/terms",
    "privacyPolicyUrl": "https://your-app.com/privacy"
}
```

## 🐛 Debugging

### Enable Debug Logging
```swift
#if DEBUG
// Enable WebKit inspector for JavaScript bridge debugging
webView?.isInspectable = true
#endif
```

### Common Issues

1. **Build Errors**: Ensure all WalletKit files are added to your target
2. **WebKit Errors**: Check that WebKit.framework is properly linked
3. **URL Handling**: Verify URL schemes are configured in Info.plist
4. **JavaScript Bridge**: Use Safari Web Inspector to debug bridge communication

### Debug Menu
The app includes a debug menu with:
- WalletKit status information
- Test TonConnect URL handling
- Bridge communication logs

## 🔄 Migration from WebView Version

If you're migrating from the old WebView-based approach:

1. **Remove Old Dependencies**: The old `TonConnectBridge` is no longer needed
2. **Update UI**: Replace WebView components with native SwiftUI
3. **Update Event Handling**: Use new Swift-based event system
4. **Test Thoroughly**: Verify all wallet operations work with new implementation

## 📚 Documentation

- **Native Implementation**: `../README_NATIVE.md`
- **WalletKit API**: See Swift files for detailed documentation
- **Integration Guides**: `../XCODE_INTEGRATION.md`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

Same license as the parent WalletKit project.

---

**🎉 Enjoy building with Native WalletKit!**

For questions or issues, please check the main project documentation or create an issue in the repository.
