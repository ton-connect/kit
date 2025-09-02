//
//  ContentView.swift
//  IOSKitDemo
//
//  Native SwiftUI view using TonWalletKit
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var walletKit: TonWalletKitSwift
    @State private var showingDebugAlert = false
    @State private var debugMessage = ""
    
    var body: some View {
        WalletKitView(walletKit: walletKit)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button("Refresh") {
                            refreshWalletKit()
                        }
                        
                        Button("Show Debug Info") {
                            showDebugInfo()
                        }
                        
                        Button("Test URL") {
                            testTonConnectURL()
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .alert("Debug Info", isPresented: $showingDebugAlert) {
                Button("OK") { }
            } message: {
                Text(debugMessage)
            }
    }
    
    // MARK: - Configuration
    
    private var walletKitConfig: WalletKitConfig {
        WalletKitConfig(
            apiKey: nil, // Add your API key if needed
            network: .mainnet,
            storage: .local,
            manifestUrl: "https://raw.githubusercontent.com/ton-connect/demo-dapp-with-wallet/master/public/tonconnect-manifest.json"
        )
    }
    
    // MARK: - Actions
    
    private func refreshWalletKit() {
        Task {
            // Trigger a state refresh
            print("🔄 Refreshing WalletKit state...")
            // The @Published properties in walletKit will automatically update the UI
        }
    }
    
    private func showDebugInfo() {
        debugMessage = """
        Native WalletKit Status
        
        Initialized: \(walletKit.isInitialized ? "✅ Yes" : "❌ No")
        Wallets Count: \(walletKit.wallets.count)
        Sessions Count: \(walletKit.sessions.count)
        Network: \(walletKitConfig.network == .mainnet ? "Mainnet" : "Testnet")
        Storage: \(storageTypeString())
        
        SwiftUI Integration: ✅ Native
        WalletKit Version: 2.0.0 (Native)
        """
        
        showingDebugAlert = true
    }
    
    private func testTonConnectURL() {
        // Test with a sample TonConnect URL
        let testURL = "https://app.tonkeeper.com/ton-connect?v=2&id=demo&r=%7B%22manifestUrl%22%3A%22https%3A%2F%2Fraw.githubusercontent.com%2Fton-connect%2Fdemo-dapp-with-wallet%2Fmaster%2Fpublic%2Ftonconnect-manifest.json%22%2C%22items%22%3A%5B%7B%22name%22%3A%22ton_addr%22%7D%5D%7D"
        
        Task {
            do {
                try await walletKit.handleTonConnectUrl(testURL)
                print("✅ Test TonConnect URL handled successfully")
            } catch {
                print("❌ Failed to handle test TonConnect URL: \(error)")
            }
        }
    }
    
    private func storageTypeString() -> String {
        switch walletKitConfig.storage {
        case .local:
            return "Local Storage"
        case .memory:
            return "Memory Storage"
        case .custom(let id):
            return "Custom Storage (\(id))"
        }
    }
}

// MARK: - Preview
struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
            .environmentObject(TonWalletKitSwift(config: WalletKitConfig(
                network: .testnet,
                storage: .memory,
                manifestUrl: "https://example.com/manifest.json"
            )))
    }
}

