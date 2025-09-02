//
//  IOSKitDemoApp.swift
//  IOSKitDemo
//
//  Native SwiftUI App with TonWalletKit integration
//

import SwiftUI

@main
struct IOSKitDemoApp: App {
    
    init() {
        print("🚀 IOSKit Demo starting up with Native WalletKit...")
        setupAppConfiguration()
    }
    
    var body: some Scene {
        WindowGroup {
            EngineSelectionView()
                .onAppear {
                    print("✅ Native WalletKit Demo interface loaded")
                }
                .onOpenURL { url in
                    handleTonConnectURL(url)
                }
        }
    }
    
    // MARK: - Configuration
    
    private func setupAppConfiguration() {
        setupAppearance()
        
        #if DEBUG
        print("🔧 Debug mode enabled")
        print("📱 Device: \(UIDevice.current.model)")
        print("📱 iOS Version: \(UIDevice.current.systemVersion)")
        print("🎯 Using EngineSelectionView for WalletKit initialization")
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
        print("🔗 Handling TonConnect URL: \(url)")
        // URL handling will be managed by the active WalletKit instance in EngineSelectionView
        // TODO: Implement proper deep link routing when wallet is initialized
    }
}

