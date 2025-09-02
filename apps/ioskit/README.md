# iOS WalletKit Integration

This project demonstrates how to integrate the TON WalletKit library into native iOS applications using Swift and SwiftUI.

## 🎯 Overview

The iOS WalletKit integration provides two distinct approaches:

1. **WebKit Bridge** - Uses a minimal HTML bridge that forwards calls to Swift
2. **Native JavaScriptCore** - Runs JavaScript directly using JavaScriptCore

Both approaches provide the same Swift API for seamless integration into iOS apps.

## 📁 Project Structure

```
IOSKitDemo/
├── IOSKitDemo/
│   ├── WalletKit/                      # Core WalletKit integration
│   │   ├── WalletKitSwift.swift       # Main Swift API
│   │   ├── WalletKitEngine.swift      # WebKit implementation  
│   │   ├── WalletKitNativeEngine.swift # JavaScriptCore implementation
│   │   └── WalletKitTypes.swift       # Type definitions
│   ├── WalletKitAdapter/              # WebKit bridge files
│   │   └── walletkit-adapter.html     # Minimal HTML bridge
│   └── SwiftUI Views/                 # Demo UI components
├── INTEGRATION.md                     # Detailed integration guide
└── README.md                         # This file
```

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kit/apps/ioskit/IOSKitDemo
   ```

2. **Open in Xcode**
   ```bash
   open IOSKitDemo.xcodeproj
   ```

3. **Run the demo**
   - Select your target device/simulator
   - Build and run (⌘R)
   - Choose between WebKit Bridge or Native Engine

## 🔧 Integration Methods

### WebKit Bridge (Recommended)

Uses a WebView with a minimal HTML page that forwards JavaScript calls to Swift.

**Pros:**
- ✅ Stable and battle-tested
- ✅ Full WalletKit functionality  
- ✅ Better JavaScript compatibility
- ✅ Web inspector debugging support

**Cons:**
- ❌ Requires WebView permissions
- ❌ Slightly larger memory footprint

### Native JavaScriptCore

Runs WalletKit JavaScript directly using iOS's JavaScriptCore framework.

**Pros:**
- ✅ No WebView required
- ✅ Smaller memory footprint
- ✅ More direct integration

**Cons:**
- ❌ Some methods not yet implemented
- ❌ Limited JavaScript debugging
- ❌ Potential compatibility issues

## 💻 Usage Example

```swift
import SwiftUI

struct MyWalletApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(createWalletKit())
        }
    }
    
    private func createWalletKit() -> TonWalletKitSwift {
        let config = WalletKitConfig(
            network: .testnet,
            storage: .memory,
            manifestUrl: "https://your-app.com/tonconnect-manifest.json"
        )
        
        // Choose your integration method
        return TonWalletKitSwift(
            config: config,
            useNativeEngine: false // false = WebKit, true = Native
        )
    }
}
```

## 🔗 TON Connect Integration

The WalletKit handles TON Connect protocol automatically:

```swift
// Handle TON Connect URLs
try await walletKit.handleTonConnectUrl("tc://...")

// Set up event handlers
walletKit.onConnectRequest = { event in
    // Show connection approval UI
}

walletKit.onTransactionRequest = { event in  
    // Show transaction approval UI
}
```

## 🛠 Development Status

### WebKit Bridge: ✅ Production Ready
- All WalletKit methods implemented
- Fully tested and stable
- Recommended for production apps

### Native Engine: 🚧 Beta
Currently implemented methods:
- ✅ `initialize()`
- ✅ `addWallet()`
- ✅ `getWallets()`
- ✅ `handleTonConnectUrl()`
- ✅ `approveConnectRequest()`

Methods pending implementation:
- ⏳ `removeWallet()`
- ⏳ `clearWallets()`
- ⏳ `disconnect()`
- ⏳ `rejectConnectRequest()`
- ⏳ `approveTransactionRequest()`
- ⏳ `getJettons()`

## 📋 Requirements

- iOS 14.0+
- Xcode 14.0+
- Swift 5.7+

### Required Frameworks
- `WebKit.framework`
- `JavaScriptCore.framework`
- `Combine.framework`

## 🔧 Configuration

### WalletKitConfig Options

```swift
let config = WalletKitConfig(
    network: .testnet,           // .mainnet or .testnet
    storage: .local,             // .local, .memory, or .custom("id")
    manifestUrl: "https://..."   // Your app's TON Connect manifest
)
```

### TON Connect Manifest

Create a manifest file describing your app:

```json
{
    "url": "https://your-app.com",
    "name": "Your App Name", 
    "iconUrl": "https://your-app.com/icon.png",
    "termsOfUseUrl": "https://your-app.com/terms",
    "privacyPolicyUrl": "https://your-app.com/privacy"
}
```

## 🐛 Troubleshooting

### Common Issues

1. **WebKit Bridge not loading**
   - Ensure `walletkit-adapter.html` is in your app bundle
   - Check Xcode build phases include the file
   - Verify file permissions

2. **JavaScript errors**
   - Enable web inspector in iOS Simulator
   - Check Xcode console for detailed error logs

3. **Native engine method not implemented**
   - This is expected for beta features
   - Use WebKit bridge for full functionality

## 📚 Documentation

- [INTEGRATION.md](INTEGRATION.md) - Detailed integration guide
- [WalletKit Specification](../../packages/walletkit/SPECIFICATION.md) - Core library docs
- [TON Connect Protocol](https://github.com/ton-connect/docs) - Protocol documentation

## 🧪 Testing

The demo app includes comprehensive testing for both integration methods:

1. **Engine Selection** - Choose between WebKit/Native
2. **Wallet Management** - Create, import, manage wallets
3. **TON Connect** - Handle connection requests
4. **Transaction Signing** - Approve/reject transactions

## 🤝 Contributing

Contributions are welcome! Areas needing work:

1. Complete native engine implementation
2. Add comprehensive unit tests
3. Improve error handling
4. Performance optimizations

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Related Projects

- [TON Wallet Kit](../../packages/walletkit/) - Core JavaScript library
- [Demo Wallet](../demo-wallet/) - Web-based reference implementation
- [TON Connect](https://github.com/ton-connect) - Protocol and standards