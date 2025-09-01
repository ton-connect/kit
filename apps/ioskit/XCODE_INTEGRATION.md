# Xcode Integration Guide

Complete guide for integrating the TonConnect bridge files into your Xcode project.

## 📁 Files to Add to Xcode

After creating your Xcode project, you need to add these files:

### 1. Swift Bridge Files
- `src/bridge/TonConnectBridge.swift` - Main bridge implementation
- `src/utils/BridgeTypes.swift` - Type definitions and errors
- `src/xcode/WalletKitIntegration.swift` - WalletKit integration layer

### 2. Swift App Files
- `src/xcode/ViewController.swift` - Main view controller (replace default)
- `src/xcode/AppDelegate.swift` - App delegate (replace default)
- `src/xcode/SceneDelegate.swift` - Scene delegate (replace default)

### 3. Web Interface
- `src/web/index.html` - Demo web interface

### 4. Configuration
- `src/xcode/Info.plist` - App configuration (merge with existing)

## 🔧 Step-by-Step Integration

### Step 1: Add Swift Files to Xcode

1. **Open your Xcode project**
   ```bash
   open apps/ioskit/IOSKitDemo/IOSKitDemo.xcodeproj
   ```

2. **Add Bridge Files:**
   - Right-click on your project folder in Xcode Navigator
   - Choose "Add Files to [ProjectName]"
   - Navigate to `apps/ioskit/src/bridge/`
   - Select `TonConnectBridge.swift`
   - Make sure "Add to target" is checked ✅
   - Repeat for `src/utils/BridgeTypes.swift`
   - Repeat for `src/xcode/WalletKitIntegration.swift`

3. **Replace Default Files:**
   - **ViewController.swift**: Replace contents with `src/xcode/ViewController.swift`
   - **AppDelegate.swift**: Replace contents with `src/xcode/AppDelegate.swift` 
   - **SceneDelegate.swift**: Replace contents with `src/xcode/SceneDelegate.swift`

### Step 2: Add Web Assets

1. **Add HTML File:**
   - Right-click on project folder in Xcode
   - Choose "Add Files to [ProjectName]"
   - Navigate to `apps/ioskit/src/web/`
   - Select `index.html`
   - **IMPORTANT**: Choose "Create folder references" (blue folder icon)
   - Make sure "Add to target" is checked ✅

### Step 3: Configure Info.plist

1. **Open Info.plist in Xcode**
2. **Add TonConnect Configuration:**
   - Copy the sections from `src/xcode/Info.plist`:
     - `NSAppTransportSecurity` configuration
     - `CFBundleURLTypes` for URL schemes
     - Privacy descriptions
     - WebView permissions

### Step 4: Add WebKit Framework

1. **Select Project Target:**
   - Click on your project name at the top of navigator
   - Select your app target

2. **Add Framework:**
   - Go to "Build Phases" tab
   - Expand "Link Binary With Libraries"
   - Click "+" button
   - Search for and add `WebKit.framework`

### Step 5: Configure Build Settings

1. **Set Minimum iOS Version:**
   - Go to "Build Settings" tab
   - Search for "iOS Deployment Target"
   - Set to `14.0` or higher

2. **Enable Web Inspector (Debug):**
   - Already configured in the bridge code for iOS 16.4+

## 🧪 Testing Your Integration

### Build and Run
```bash
# In Xcode: Press Cmd+R or click Play button
```

### Verify Bridge Works
1. App should launch showing TonConnect demo interface
2. Tap "Test Bridge Connection" - should show success
3. Check Xcode console for bridge communication logs
4. Try wallet operations (mock implementations)

## 🔍 Troubleshooting

### Common Issues and Solutions

**1. Build Errors: "Use of undeclared type 'TonConnectBridge'"**
- Solution: Make sure all Swift files are added to the target
- Check Build Phases → Compile Sources

**2. Web Interface Not Loading**
- Solution: Ensure `index.html` is added as "folder reference" (blue folder)
- Check Bundle Resources in Build Phases

**3. Bridge Communication Fails**
- Solution: Check console logs for JavaScript errors
- Verify WebKit framework is linked
- Ensure Info.plist has proper permissions

**4. App Crashes on Launch**
- Solution: Check that replaced files have correct class names
- Verify all @IBOutlet connections are removed (we're using programmatic UI)

### Debug Console Commands

```bash
# Check build issues
xcodebuild -project IOSKitDemo.xcodeproj -scheme IOSKitDemo clean build

# Check for missing files
find apps/ioskit/src -name "*.swift" -exec echo "Swift file: {}" \;
```

## 📱 Project Structure After Integration

Your Xcode project should look like this:

```
IOSKitDemo/
├── IOSKitDemo/
│   ├── AppDelegate.swift          ✅ Updated
│   ├── SceneDelegate.swift        ✅ Updated  
│   ├── ViewController.swift       ✅ Updated
│   ├── TonConnectBridge.swift     ✅ Added
│   ├── BridgeTypes.swift          ✅ Added
│   ├── WalletKitIntegration.swift ✅ Added
│   ├── index.html                 ✅ Added (blue folder)
│   ├── Info.plist                 ✅ Updated
│   ├── Assets.xcassets/
│   └── LaunchScreen.storyboard
├── IOSKitDemo.xcodeproj
└── IOSKitDemoTests/ (optional)
```

## 🚀 Next Steps

After successful integration:

1. **Test all bridge methods** in the demo interface
2. **Review console logs** to understand bridge communication
3. **Customize the interface** by modifying `index.html`
4. **Replace mock implementations** in `WalletKitIntegration.swift` with real WalletKit calls
5. **Add error handling** specific to your app's needs

## 🔗 Real WalletKit Integration

The `WalletKitIntegration.swift` file is set up with placeholder methods. To integrate with real WalletKit:

```swift
// Example: Replace mock with real WalletKit
func connectWallet() async throws -> WalletInfo {
    // TODO: Replace this line
    // let wallet = try await WalletKit.connect()
    // return WalletInfo(from: wallet)
    
    // Current mock implementation...
}
```

## 📞 Support

If you encounter issues:

1. Check the console output in Xcode for detailed error messages
2. Run the setup verification script: `./apps/ioskit/setup.sh`
3. Review the main README: `apps/ioskit/README.md`

