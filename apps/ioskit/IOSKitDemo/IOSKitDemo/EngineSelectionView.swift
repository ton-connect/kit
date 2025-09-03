//
//  EngineSelectionView.swift
//  IOSKitDemo
//
//  Demo view showing WalletKit Native JavaScriptCore integration
//

import SwiftUI

struct EngineSelectionView: View {
    @State private var selectedEngine: EngineType = .native
    @State private var walletKit: TonWalletKitSwift?
    @State private var isInitializing = false
    @State private var initializationError: Error?
    
    enum EngineType: String, CaseIterable {
        case native = "Native JavaScriptCore"
        
        var description: String {
            switch self {
            case .native:
                return "Uses JavaScriptCore directly for optimal performance"
            }
        }
        
        var icon: String {
            switch self {
            case .native:
                return "gearshape.2"
            }
        }
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                if let walletKit = walletKit, walletKit.isInitialized {
                    WalletKitView(walletKit: walletKit)
                } else {
                    VStack(spacing: 30) {
                        // Header
                        VStack(spacing: 10) {
                            Image(systemName: "wallet.pass.fill")
                                .font(.system(size: 60))
                                .foregroundColor(.blue)
                            
                            Text("TON Wallet Kit")
                                .font(.largeTitle)
                                .bold()
                            
                            Text("iOS Integration Demo")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        
                        // Engine Info
                        VStack(alignment: .leading, spacing: 15) {
                            Text("Integration Method:")
                                .font(.headline)
                            
                            engineInfoCard()
                        }
                        .padding()
                        .background(Color.gray.opacity(0.05))
                        .cornerRadius(15)
                        
                        // Status/Action Area
                        VStack(spacing: 15) {
                            if isInitializing {
                                VStack(spacing: 10) {
                                    ProgressView()
                                        .scaleEffect(1.2)
                                    Text("Initializing Native JavaScriptCore Engine...")
                                        .font(.subheadline)
                                        .foregroundColor(.secondary)
                                    Text("This may take a moment...")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                .padding()
                            } else {
                                Button(action: initializeWalletKit) {
                                    HStack {
                                        Image(systemName: "play.circle.fill")
                                        Text("Initialize WalletKit")
                                    }
                                    .font(.headline)
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(Color.blue)
                                    .cornerRadius(10)
                                }
                            }
                            
                            if let error = initializationError {
                                VStack(spacing: 8) {
                                    HStack {
                                        Image(systemName: "exclamationmark.triangle.fill")
                                            .foregroundColor(.orange)
                                        Text("Initialization Failed")
                                            .font(.headline)
                                            .foregroundColor(.orange)
                                    }
                                    
                                    Text(error.localizedDescription)
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                        .multilineTextAlignment(.center)
                                }
                                .padding()
                                .background(Color.orange.opacity(0.1))
                                .cornerRadius(8)
                            }
                        }
                        
                        // Info Section
                        VStack(alignment: .leading, spacing: 8) {
                            Text("About Native Engine")
                                .font(.headline)
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text("• Direct JavaScript execution with JavaScriptCore")
                                Text("• Optimal performance without WebView overhead") 
                                Text("• Lightweight and efficient iOS integration")
                            }
                            .font(.caption)
                            .foregroundColor(.secondary)
                        }
                        .padding()
                        .background(Color.blue.opacity(0.05))
                        .cornerRadius(8)
                    }
                    .padding()
                }
            }
            .navigationTitle("WalletKit Demo")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                if walletKit?.isInitialized == true {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Reset") {
                            resetWalletKit()
                        }
                    }
                }
            }
        }
    }
    
    @ViewBuilder
    private func engineInfoCard() -> some View {
        let engine = EngineType.native
        HStack(spacing: 12) {
            Image(systemName: engine.icon)
                .font(.title2)
                .foregroundColor(.blue)
                .frame(width: 30)
            
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(engine.rawValue)
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    Spacer()
                    
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.blue)
                }
                
                Text(engine.description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color.blue.opacity(0.1))
        .cornerRadius(8)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.blue, lineWidth: 2)
        )
    }
    
    private func initializeWalletKit() {
        isInitializing = true
        initializationError = nil
        
        let config = createWalletKitConfig()
        
        let newWalletKit = TonWalletKitSwift(config: config)
        
        Task {
            do {
                try await newWalletKit.initialize()
                
                await MainActor.run {
                    self.walletKit = newWalletKit
                    self.isInitializing = false
                    print("✅ WalletKit initialized with Native JavaScriptCore Engine")
                }
            } catch {
                await MainActor.run {
                    self.initializationError = error
                    self.isInitializing = false
                    print("❌ WalletKit initialization failed: \(error)")
                }
            }
        }
    }
    
    private func resetWalletKit() {
        walletKit = nil
        initializationError = nil
        isInitializing = false
    }
    
    private func createWalletKitConfig() -> WalletKitConfig {
        return WalletKitConfig(
            network: .testnet, // Use testnet for demo
            storage: .memory,  // Use memory storage for demo
            manifestUrl: "https://raw.githubusercontent.com/ton-connect/demo-dapp-with-wallet/master/public/tonconnect-manifest.json"
        )
    }
}

// MARK: - Preview
struct EngineSelectionView_Previews: PreviewProvider {
    static var previews: some View {
        EngineSelectionView()
    }
}
