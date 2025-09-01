# iOS Kit Demo App

A demo iOS app that integrates with TonConnect Kit using a JavaScript bridge.

## Setup Instructions

### 1. Create Xcode Project

1. Open Xcode
2. Create a new project:
   - Choose "iOS" → "App"
   - Product Name: `IOSKitDemo`
   - Team: Your development team
   - Organization Identifier: `com.yourcompany.ioskitdemo`
   - Language: Swift
   - Interface: UIKit (not SwiftUI for WebView compatibility)
   - Use Core Data: No
   - Include Tests: Yes (optional)
3. Save the project in this directory (`apps/ioskit/IOSKitDemo`)

### 2. Project Structure

After creating the Xcode project, your structure should look like:

```
apps/ioskit/
├── package.json
├── README.md
├── src/
│   ├── bridge/
│   │   └── TonConnectBridge.swift
│   ├── web/
│   │   └── index.html
│   └── utils/
└── IOSKitDemo/                 # Xcode project directory
    ├── IOSKitDemo.xcodeproj
    ├── IOSKitDemo/
    │   ├── AppDelegate.swift
    │   ├── SceneDelegate.swift
    │   ├── ViewController.swift
    │   └── ...
    └── ...
```

### 3. Integration Steps

1. **Add WebKit Framework:**
   - In Xcode, select your project target
   - Go to "Build Phases" → "Link Binary With Libraries"
   - Add `WebKit.framework`

2. **Copy Bridge Files:**
   - Drag the `src/bridge/TonConnectBridge.swift` file into your Xcode project
   - Make sure it's added to your target

3. **Copy Web Assets:**
   - Add the `src/web/` directory to your Xcode project as a folder reference
   - Ensure the HTML file is included in your app bundle

4. **Configure Info.plist:**
   - Add network permissions if needed for web content

## Architecture

The app uses a WebView-based architecture similar to MyTonWallet:

1. **Swift UI Layer**: Native iOS UI with WebView container
2. **JavaScript Bridge**: Two-way communication between Swift and JS
3. **TonConnect Integration**: Uses the walletkit package for blockchain operations
4. **Web Interface**: HTML/JS interface loaded in WebView

## Usage

1. The main ViewController loads the WebView with the bundled HTML
2. The TonConnectBridge handles communication between Swift and JavaScript
3. TonConnect operations are handled by the walletkit package
4. Results are passed back through the bridge to the UI

## Development

- Use Xcode for native iOS development
- Web interface can be developed separately and bundled
- The bridge allows hot-reloading of web content during development
