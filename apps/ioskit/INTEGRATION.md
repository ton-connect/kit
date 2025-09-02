# WalletKit iOS Integration Guide

This document describes how to integrate the TON WalletKit library into iOS applications.

## Overview

The iOS integration provides two approaches for using WalletKit:

1. **WebKit Bridge Adapter** - Uses a WebView to run a minimal JavaScript bridge that forwards calls to Swift
2. **Native JavaScript Engine** - Uses JavaScriptCore to run WalletKit JavaScript directly in Swift

## Files Structure

```
IOSKitDemo/IOSKitDemo/
├── WalletKit/                          # Main WalletKit Swift integration
│   ├── WalletKitSwift.swift           # Main Swift API
│   ├── WalletKitEngine.swift          # WebKit-based implementation
│   ├── WalletKitNativeEngine.swift    # JavaScriptCore-based implementation
│   └── WalletKitTypes.swift           # Type definitions
├── WalletKitAdapter/                   # Minimal WebKit bridge
│   └── walletkit-adapter.html         # HTML bridge that forwards to Swift
└── WalletKitWeb/                       # (Optional) Full demo-wallet build
```

## Usage

### Basic Setup

```swift
import SwiftUI

@main
struct YourApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

struct ContentView: View {
    @StateObject private var walletKit = TonWalletKitSwift(
        config: WalletKitConfig(
            network: .testnet,
            storage: .memory,
            manifestUrl: "https://your-app.com/tonconnect-manifest.json"
        ),
        useNativeEngine: false // Set to true to use JavaScriptCore instead of WebKit
    )
    
    var body: some View {
        VStack {
            if walletKit.isInitialized {
                WalletKitView(walletKit: walletKit)
            } else {
                ProgressView("Initializing WalletKit...")
                    .onAppear {
                        Task {
                            try await walletKit.initialize()
                        }
                    }
            }
        }
    }
}
```

### WebKit Bridge Approach (Recommended)

This approach uses a WebView with a minimal HTML page that forwards JavaScript calls to Swift:

```swift
// Uses WebKit bridge (default)
let walletKit = TonWalletKitSwift(
    config: config,
    useNativeEngine: false
)
```

**Pros:**
- More stable and tested
- Better compatibility with complex JavaScript
- Easier to debug with web inspector

**Cons:**
- Requires WebView permissions
- Slightly larger memory footprint
- Needs HTML file in app bundle

### Native JavaScriptCore Approach

This approach runs WalletKit JavaScript directly using JavaScriptCore:

```swift
// Uses JavaScriptCore engine
let walletKit = TonWalletKitSwift(
    config: config,
    useNativeEngine: true
)
```

**Pros:**
- No WebView required
- Smaller memory footprint
- More direct integration

**Cons:**
- Currently has limited WalletKit methods implemented
- May have compatibility issues with complex JavaScript
- Harder to debug

## Adding Files to Xcode Project

1. **Add WalletKit Swift Files:**
   - Drag the `WalletKit/` folder into your Xcode project
   - Make sure "Copy items if needed" is checked
   - Add to your target

2. **Add WebKit Adapter (if using WebKit bridge):**
   - Drag the `WalletKitAdapter/` folder into your Xcode project
   - Make sure "Copy items if needed" is checked
   - Ensure `walletkit-adapter.html` is included in the app bundle

3. **Add Required Frameworks:**
   ```
   - WebKit.framework
   - JavaScriptCore.framework
   - Combine.framework
   ```

## Configuration

### WalletKitConfig

```swift
let config = WalletKitConfig(
    network: .testnet,           // .mainnet or .testnet
    storage: .local,             // .local, .memory, or .custom("identifier")
    manifestUrl: "https://your-app.com/tonconnect-manifest.json"
)
```

### TON Connect Manifest

Create a manifest file for your app:

```json
{
    "url": "https://your-app.com",
    "name": "Your App Name",
    "iconUrl": "https://your-app.com/icon.png",
    "termsOfUseUrl": "https://your-app.com/terms",
    "privacyPolicyUrl": "https://your-app.com/privacy"
}
```

## API Usage

### Wallet Management

```swift
// Add a wallet
let walletConfig = WalletConfig(
    mnemonic: "your mnemonic phrase here",
    name: "My Wallet",
    network: .testnet,
    version: "v5r1"
)
try await walletKit.addWallet(walletConfig)

// Get wallets
let wallets = walletKit.getWallets()

// Remove wallet
if let wallet = wallets.first {
    try await walletKit.removeWallet(wallet)
}
```

### Handle TON Connect URLs

```swift
// Handle pasted TON Connect URL
try await walletKit.handleTonConnectUrl("tc://...")

// Set up event handlers
walletKit.onConnectRequest = { event in
    // Show connect approval UI
    print("Connect request from: \(event.dAppName)")
}

walletKit.onTransactionRequest = { event in
    // Show transaction approval UI
    print("Transaction request: \(event.amount)")
}
```

### Request Processing

```swift
// Approve connect request
try await walletKit.approveConnectRequest(event, wallet: selectedWallet)

// Approve transaction
let result = try await walletKit.approveTransactionRequest(transactionEvent)

// Reject requests
try await walletKit.rejectConnectRequest(event, reason: "User declined")
```

## Current Limitations

### Native Engine Limitations

The JavaScriptCore-based native engine currently has several methods that are not fully implemented:

- `removeWallet()`
- `clearWallets()`
- `disconnect()`
- `rejectConnectRequest()`
- `rejectTransactionRequest()`
- `rejectSignDataRequest()`
- `getJettons()`

These will be implemented in future updates. For now, use the WebKit bridge approach for full functionality.

## Troubleshooting

### WebKit Bridge Issues

1. **HTML file not found:**
   - Ensure `walletkit-adapter.html` is added to your Xcode project
   - Check that the file is included in your app target
   - Verify the file is in the `WalletKitAdapter` folder in your bundle

2. **JavaScript errors:**
   - Enable web inspector in iOS Simulator
   - Check console logs in Xcode for JavaScript errors

3. **Bridge communication issues:**
   - Check that message handlers are properly set up
   - Verify that `window.walletKitSwiftBridge` is available

### Native Engine Issues

1. **JavaScript context errors:**
   - Check Xcode console for JavaScript evaluation errors
   - Verify that the WalletKit mock is properly loaded

2. **Method not implemented warnings:**
   - This is expected for currently unimplemented methods
   - Use WebKit bridge for full functionality

## Next Steps

- Implement remaining methods in native engine
- Add proper error handling and validation
- Create more comprehensive SwiftUI components
- Add unit tests
- Optimize performance and memory usage

## Example App

See the `IOSKitDemo` project for a complete working example of both integration approaches.
