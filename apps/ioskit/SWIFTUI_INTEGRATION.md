# SwiftUI Integration Guide

Since you've created a **SwiftUI project**, here's the specific integration guide for your setup.

## 🎯 Quick Integration Steps

### Step 1: Replace SwiftUI Files

**Replace these existing files in your Xcode project with the updated versions:**

1. **ContentView.swift** → Replace with `src/xcode/ContentView.swift`
2. **IOSKitDemoApp.swift** → Replace with `src/xcode/IOSKitDemoApp.swift`

### Step 2: Add Bridge Files

**Add these new Swift files to your Xcode project:**

1. **Right-click** on your project folder in Xcode Navigator
2. **Choose** "Add Files to IOSKitDemo"
3. **Add these files one by one:**
   - `src/bridge/TonConnectBridge.swift`
   - `src/utils/BridgeTypes.swift` 
   - `src/xcode/WalletKitIntegration.swift`

**Make sure "Add to target" is checked ✅ for all files**

### Step 3: Add Web Interface

1. **Right-click** on project folder in Xcode
2. **Choose** "Add Files to IOSKitDemo"
3. **Navigate to** `src/web/`
4. **Select** `index.html`
5. **IMPORTANT**: Choose "Create folder references" (blue folder icon)
6. **Check** "Add to target" ✅

### Step 4: Add WebKit Framework

1. **Select** your project in navigator (blue icon)
2. **Select** "IOSKitDemo" target
3. **Go to** "Build Phases" tab
4. **Expand** "Link Binary With Libraries"
5. **Click** "+" button
6. **Add** `WebKit.framework`

### Step 5: Update Info.plist

**Add TonConnect configuration to your Info.plist:**

1. **Open** Info.plist in Xcode
2. **Copy these sections from** `src/xcode/Info.plist`:
   ```xml
   <!-- TonConnect Configuration -->
   <key>NSAppTransportSecurity</key>
   <dict>
       <key>NSAllowsArbitraryLoads</key>
       <true/>
   </dict>
   
   <!-- URL Schemes -->
   <key>CFBundleURLTypes</key>
   <array>
       <dict>
           <key>CFBundleURLName</key>
           <string>TonConnect</string>
           <key>CFBundleURLSchemes</key>
           <array>
               <string>tonconnect</string>
               <string>ioskitdemo</string>
           </array>
       </dict>
   </array>
   ```

## 🧪 Test Your Integration

### Build and Run

1. **Press** `Cmd + R` in Xcode
2. **App should launch** showing the TonConnect interface
3. **Test** "Test Bridge Connection" button
4. **Check** Xcode console for bridge logs

## 🎨 SwiftUI Features

Your integration includes these SwiftUI-specific features:

### 1. **TonConnectBridgeView**
- SwiftUI wrapper for the UIKit bridge
- Seamless integration with SwiftUI lifecycle

### 2. **TonConnectBridgeViewModel**
- SwiftUI state management for the bridge
- Loading states and debug information
- Reactive UI updates

### 3. **Native SwiftUI UI**
- Navigation toolbar with debug menu
- Loading indicators
- Alert dialogs for debug info

### 4. **Deep Link Handling**
- Built-in URL scheme handling
- TonConnect protocol support

## 📁 Final Project Structure

After integration, your Xcode project should look like:

```
IOSKitDemo/
├── IOSKitDemo/
│   ├── IOSKitDemoApp.swift           ✅ Updated
│   ├── ContentView.swift             ✅ Updated
│   ├── TonConnectBridge.swift        ✅ Added
│   ├── BridgeTypes.swift             ✅ Added
│   ├── WalletKitIntegration.swift    ✅ Added
│   ├── index.html                    ✅ Added (blue folder)
│   ├── Assets.xcassets/
│   └── Info.plist                    ✅ Updated
├── IOSKitDemo.xcodeproj
├── IOSKitDemoTests/
└── IOSKitDemoUITests/
```

## 🔧 Development Features

### Debug Menu
- **Reload Bridge**: Restart the WebView bridge
- **Show Debug Info**: View bridge status and configuration

### Console Logging
- All bridge communications logged to Xcode console
- SwiftUI state changes tracked
- Network requests monitored

### Live Reloading
- Modify `index.html` and rebuild to see changes
- Bridge automatically reconnects

## 🚀 Next Steps

1. **Test the demo interface** - Try all buttons to verify bridge works
2. **Customize the UI** - Modify `ContentView.swift` for your app's design
3. **Update the web interface** - Edit `src/web/index.html` as needed
4. **Integrate real WalletKit** - Replace mock methods in `WalletKitIntegration.swift`

## 🎯 SwiftUI vs UIKit Differences

| Feature | SwiftUI Version | UIKit Version |
|---------|----------------|---------------|
| **View Management** | `ContentView` with bridge wrapper | `ViewController` with direct bridge |
| **State Management** | `@StateObject` and `@Published` | Manual delegate pattern |
| **Navigation** | SwiftUI NavigationView | UINavigationController |
| **Alerts** | SwiftUI `.alert()` modifier | UIAlertController |
| **Loading States** | SwiftUI `@Published` properties | Manual UI updates |

## 🔍 Troubleshooting SwiftUI-Specific Issues

**SwiftUI Preview Issues:**
- Bridge won't work in previews (WebView limitation)
- Run on simulator/device for testing

**State Updates:**
- Use `@MainActor` for UI updates from bridge
- Bridge callbacks automatically update SwiftUI state

**Memory Management:**
- SwiftUI handles view lifecycle automatically
- Bridge properly cleans up WebView resources

---

**Ready to test?** Build and run your project - you should see the beautiful TonConnect demo interface! 🎉

