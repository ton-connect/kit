//
//  EngineSelectionView.swift
//  IOSKitDemo
//
//  Demo view showing WalletKit Native JavaScriptCore integration
//

import SwiftUI

struct EngineSelectionView: View {
    @State private var selectedEngine: WalletKitEngineType = .native
    @State private var walletKit: TonWalletKitSwift?
    @State private var isInitializing = false
    @State private var initializationError: Error?
    
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
                        
                        // Engine Selection
                        VStack(alignment: .leading, spacing: 15) {
                            Text("Integration Method:")
                                .font(.headline)
                            
                            // Engine Type Picker
                            VStack(spacing: 12) {
                                ForEach(WalletKitEngineType.allCases, id: \.self) { engineType in
                                    engineSelectionCard(engineType)
                                }
                            }
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
                                    Text("Initializing \(selectedEngine.displayName)...")
                                        .font(.subheadline)
                                        .foregroundColor(.secondary)
                                    if selectedEngine.debuggingSupport {
                                        Text("WebView loading with Safari debugging...")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    } else {
                                        Text("This may take a moment...")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
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
                            Text("About \(selectedEngine.displayName)")
                                .font(.headline)
                            
                            VStack(alignment: .leading, spacing: 4) {
                                if selectedEngine == .native {
                                    Text("• Direct JavaScript execution with JavaScriptCore")
                                    Text("• Optimal performance without WebView overhead")
                                    Text("• Lightweight and efficient iOS integration")
                                } else {
                                    Text("• JavaScript execution in WKWebView environment")
                                    Text("• Full Safari Web Inspector debugging support")
                                    Text("• Enhanced error reporting and stack traces")
                                    Text("• Perfect for development and debugging")
                                }
                            }
                            .font(.caption)
                            .foregroundColor(.secondary)
                        }
                        .padding()
                        .background(selectedEngine == .webView ? Color.green.opacity(0.05) : Color.blue.opacity(0.05))
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
    private func engineSelectionCard(_ engineType: WalletKitEngineType) -> some View {
        let isSelected = selectedEngine == engineType
        let accentColor: Color = engineType == .webView ? .green : .blue
        
        HStack(spacing: 12) {
            Image(systemName: engineType.icon)
                .font(.title2)
                .foregroundColor(isSelected ? accentColor : .gray)
                .frame(width: 30)
            
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(engineType.displayName)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(isSelected ? .primary : .secondary)
                    
                    Spacer()
                    
                    if engineType.debuggingSupport {
                        Image(systemName: "ladybug")
                            .foregroundColor(.orange)
                            .font(.caption)
                    }
                    
                    if isSelected {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(accentColor)
                    } else {
                        Image(systemName: "circle")
                            .foregroundColor(.gray)
                    }
                }
                
                Text(engineType.description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(isSelected ? accentColor.opacity(0.1) : Color.gray.opacity(0.05))
        .cornerRadius(8)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(isSelected ? accentColor : Color.gray.opacity(0.3), lineWidth: isSelected ? 2 : 1)
        )
        .onTapGesture {
            selectedEngine = engineType
        }
    }
    
    private func initializeWalletKit() {
        isInitializing = true
        initializationError = nil
        
        let config = createWalletKitConfig()
        
        let newWalletKit = TonWalletKitSwift(config: config, engineType: selectedEngine)
        
        Task {
            do {
                try await newWalletKit.initialize()
                
                await MainActor.run {
                    self.walletKit = newWalletKit
                    self.isInitializing = false
                    print("✅ WalletKit initialized with \(selectedEngine.displayName)")
                    
                    // Show debugging hint for WebView
                    if selectedEngine.debuggingSupport {
                        print("🐛 Debug Tip: Open Safari → Develop → [This Device] → WalletKit WebView to debug JavaScript")
                    }
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
