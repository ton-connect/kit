//
//  IOSKitDemoApp.swift
//  IOSKitDemo
//
//  SwiftUI App with TonConnect integration
//

import SwiftUI

@main
struct IOSKitDemoApp: App {
    
    init() {
        print("🚀 IOSKit Demo starting up...")
        setupAppConfiguration()
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .onAppear {
                    print("✅ TonConnect Demo interface loaded")
                }
                .onOpenURL { url in
                    handleTonConnectURL(url)
                }
        }
    }
    
    private func setupAppConfiguration() {
        // Configure app for TonConnect
        setupNetworkConfiguration()
        setupAppearance()
        
        #if DEBUG
        print("🔧 Debug mode enabled")
        print("📱 Device: \(UIDevice.current.model)")
        print("📱 iOS Version: \(UIDevice.current.systemVersion)")
        #endif
    }
    
    private func setupNetworkConfiguration() {
        // Configure URL cache for better WebView performance
        let memoryCapacity = 50 * 1024 * 1024 // 50 MB
        let diskCapacity = 100 * 1024 * 1024   // 100 MB
        let cache = URLCache(memoryCapacity: memoryCapacity, diskCapacity: diskCapacity, diskPath: "tonconnect_cache")
        URLCache.shared = cache
        
        print("✅ Network cache configured")
    }
    
    private func setupAppearance() {
        // Configure navigation bar appearance
        let appearance = UINavigationBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor.systemBackground
        appearance.titleTextAttributes = [.foregroundColor: UIColor.label]
        appearance.largeTitleTextAttributes = [.foregroundColor: UIColor.label]
        
        UINavigationBar.appearance().standardAppearance = appearance
        UINavigationBar.appearance().scrollEdgeAppearance = appearance
        
        // Set global tint color
        UIApplication.shared.windows.first?.tintColor = UIColor.systemBlue
    }
    
    private func handleTonConnectURL(_ url: URL) {
        print("🔗 Handling TonConnect URL: \(url)")
        
        // Handle TonConnect deep links
        if url.scheme == "tonconnect" || url.host == "tonconnect" {
            // Post notification for TonConnect bridge to handle
            let userInfo = ["url": url]
            NotificationCenter.default.post(
                name: .tonConnectURLReceived,
                object: nil,
                userInfo: userInfo
            )
        }
    }
}

// MARK: - App State Management
extension IOSKitDemoApp {
    private func handleMemoryWarning() {
        print("⚠️ Memory warning received")
        
        // Clear caches if needed
        URLCache.shared.removeAllCachedResponses()
        
        // Post notification for bridge to handle memory pressure
        NotificationCenter.default.post(name: UIApplication.didReceiveMemoryWarningNotification, object: nil)
    }
}

