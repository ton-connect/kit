//
//  IOSKitDemoApp.swift
//  IOSKitDemo
//
//  Native SwiftUI App with TonWalletKit integration
//

import SwiftUI

@main
struct IOSKitDemoApp: App {
    
    // WalletKit instance shared across the app
    @StateObject private var walletKit = TonWalletKitSwift(config: walletKitConfig)
    
    init() {
        print("🚀 IOSKit Demo starting up with Native WalletKit...")
        setupAppConfiguration()
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(walletKit)
                .onAppear {
                    print("✅ Native WalletKit Demo interface loaded")
                }
                .onOpenURL { url in
                    handleTonConnectURL(url)
                }
        }
    }
    
    // MARK: - Configuration
    
    private static var walletKitConfig: WalletKitConfig {
        WalletKitConfig(
            apiKey: nil, // Add your API key if needed
            network: .mainnet,
            storage: .local,
            manifestUrl: "https://raw.githubusercontent.com/ton-connect/demo-dapp-with-wallet/master/public/tonconnect-manifest.json"
        )
    }
    
    private func setupAppConfiguration() {
        setupAppearance()
        
        #if DEBUG
        print("🔧 Debug mode enabled")
        print("📱 Device: \(UIDevice.current.model)")
        print("📱 iOS Version: \(UIDevice.current.systemVersion)")
        print("🔗 WalletKit Config: \(Self.walletKitConfig)")
        #endif
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
        
        print("✅ App appearance configured")
    }
    
    private func handleTonConnectURL(_ url: URL) {
        print("🔗 Handling TonConnect URL with Native WalletKit: \(url)")
        
        // Handle TonConnect deep links with native WalletKit
        Task {
            do {
                try await walletKit.handleTonConnectUrl(url.absoluteString)
                print("✅ TonConnect URL handled successfully")
            } catch {
                print("❌ Failed to handle TonConnect URL: \(error)")
            }
        }
    }
}

