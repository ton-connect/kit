# iOS Kit Setup Guide

This guide will walk you through creating the iOS demo app with TonConnect integration.

## 🚀 Quick Start

### Step 1: Create Xcode Project

1. **Open Xcode**
2. **Create New Project:**
   - File → New → Project
   - Choose "iOS" tab
   - Select "App" template
   - Click "Next"

3. **Configure Project:**
   - **Product Name**: `IOSKitDemo`
   - **Team**: Select your development team
   - **Organization Identifier**: `com.yourcompany.ioskitdemo` (change to your domain)
   - **Bundle Identifier**: Will auto-generate based on above
   - **Language**: `Swift`
   - **Interface**: `UIKit` (NOT SwiftUI - we need UIKit for WebView)
   - **Use Core Data**: `Unchecked`
   - **Include Tests**: `Checked` (optional)

4. **Save Location:**
   - Navigate to: `/Users/truecarry/GitHub/kit/apps/ioskit/`
   - Create and save the project here
   - Final structure: `apps/ioskit/IOSKitDemo/IOSKitDemo.xcodeproj`

### Step 2: Configure Project Settings

1. **Add WebKit Framework:**
   - Select project in navigator (blue icon at top)
   - Select "IOSKitDemo" target
   - Go to "Build Phases" tab
   - Expand "Link Binary With Libraries"
   - Click "+" and add `WebKit.framework`

2. **Set Deployment Target:**
   - In "Build Settings" tab
   - Search for "iOS Deployment Target"
   - Set to iOS 14.0 or later

### Step 3: Add Bridge Files

1. **Add Bridge Swift Files:**
   - Right-click on "IOSKitDemo" folder in Xcode
   - Choose "Add Files to IOSKitDemo"
   - Navigate to `src/bridge/` folder
   - Select `TonConnectBridge.swift` and `BridgeTypes.swift`
   - Make sure "Add to target" is checked for IOSKitDemo

2. **Add Web Assets:**
   - Right-click on "IOSKitDemo" folder in Xcode
   - Choose "Add Files to IOSKitDemo"
   - Navigate to `src/web/` folder
   - Select `index.html`
   - **Important**: Choose "Create folder references" (not "Create groups")
   - Make sure "Add to target" is checked for IOSKitDemo

### Step 4: Update Main View Controller

Replace the contents of `ViewController.swift` with:

```swift
import UIKit

class ViewController: UIViewController {
    
    private var tonConnectBridge: TonConnectBridge?
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Create and present TonConnect bridge
        tonConnectBridge = TonConnectBridge()
        
        // Add as child view controller
        addChild(tonConnectBridge!)
        view.addSubview(tonConnectBridge!.view)
        tonConnectBridge!.view.frame = view.bounds
        tonConnectBridge!.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        tonConnectBridge!.didMove(toParent: self)
    }
}
```

### Step 5: Configure App Delegate (Optional)

If you want to add custom configuration, update `AppDelegate.swift`:

```swift
import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        // Configure for TonConnect
        print("🚀 IOSKit Demo starting up...")
        
        return true
    }

    // MARK: UISceneSession Lifecycle
    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }
}
```

### Step 6: Test the Setup

1. **Build and Run:**
   - Press `Cmd + R` or click the "Play" button
   - The app should launch in the simulator
   - You should see the TonConnect demo interface

2. **Test Bridge Connection:**
   - Tap "Test Bridge Connection" button
   - Check the console output in Xcode for bridge communication logs
   - You should see successful bridge test results

## 🔧 Troubleshooting

### Common Issues

**1. WebKit Framework Not Found**
- Solution: Make sure WebKit.framework is added in "Link Binary With Libraries"

**2. HTML File Not Found**
- Solution: Ensure `index.html` was added as "folder reference" not "group"
- Check that the file is included in the target

**3. Bridge Not Working**
- Solution: Check console logs for JavaScript errors
- Ensure WKWebView delegate methods are being called

**4. Build Errors**
- Solution: Clean build folder (Product → Clean Build Folder)
- Check that all files are added to the correct target

### Console Commands for Setup Verification

```bash
# Verify project structure
ls -la /Users/truecarry/GitHub/kit/apps/ioskit/

# Check Xcode project exists
ls -la /Users/truecarry/GitHub/kit/apps/ioskit/IOSKitDemo/

# Install dependencies in main project
cd /Users/truecarry/GitHub/kit
pnpm install
```

## 📱 Device Testing

### Simulator Testing
- iOS Simulator works great for development
- All bridge features will work in simulator

### Physical Device Testing
- You'll need an Apple Developer account for device testing
- Configure code signing in Xcode project settings
- Select your development team in "Signing & Capabilities"

## 🔄 Next Steps

After completing setup:

1. **Customize the Bridge**: Modify `TonConnectBridge.swift` to integrate with real wallet operations
2. **Add Real TonConnect**: Replace mock implementations with actual TonConnect SDK calls
3. **Enhance UI**: Modify `index.html` to match your app's design
4. **Add Features**: Extend the bridge with additional wallet operations

## 📚 Additional Resources

- [WKWebView Documentation](https://developer.apple.com/documentation/webkit/wkwebview)
- [TonConnect Documentation](https://docs.ton.org/develop/dapps/ton-connect/overview)
- [iOS Bridge Communication](https://developer.apple.com/documentation/webkit/wkscriptmessagehandler)

---

**Need Help?** Check the console output in Xcode for detailed error messages and bridge communication logs.
