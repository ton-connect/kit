//
//  ContentView.swift
//  IOSKitDemo
//
//  SwiftUI view that hosts the TonConnect bridge
//

import SwiftUI

struct ContentView: View {
    @StateObject private var bridgeViewModel = TonConnectBridgeViewModel()
    
    var body: some View {
        NavigationView {
            ZStack {
                // TonConnect Bridge WebView
                TonConnectBridgeView()
                    .environmentObject(bridgeViewModel)
                
                // Loading indicator
                if bridgeViewModel.isLoading {
                    VStack {
                        ProgressView()
                            .scaleEffect(1.2)
                        Text("Loading TonConnect...")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .padding(.top, 8)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color.black.opacity(0.3))
                }
            }
            .navigationTitle("TonConnect Demo")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button("Reload Bridge") {
                            bridgeViewModel.reloadBridge()
                        }
                        
                        Button("Show Debug Info") {
                            bridgeViewModel.showDebugInfo()
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
        }
        .alert("Debug Info", isPresented: $bridgeViewModel.showingDebugAlert) {
            Button("OK") { }
        } message: {
            Text(bridgeViewModel.debugMessage)
        }
    }
}

// MARK: - TonConnect Bridge SwiftUI Wrapper
struct TonConnectBridgeView: UIViewControllerRepresentable {
    @EnvironmentObject var viewModel: TonConnectBridgeViewModel
    
    func makeUIViewController(context: Context) -> TonConnectBridge {
        let bridge = TonConnectBridge()
        viewModel.setBridge(bridge)
        return bridge
    }
    
    func updateUIViewController(_ uiViewController: TonConnectBridge, context: Context) {
        // Update if needed
    }
}

// MARK: - View Model for Bridge State Management
class TonConnectBridgeViewModel: ObservableObject {
    @Published var isLoading = true
    @Published var showingDebugAlert = false
    @Published var debugMessage = ""
    
    private var bridge: TonConnectBridge?
    
    func setBridge(_ bridge: TonConnectBridge) {
        self.bridge = bridge
        
        // Stop loading after a delay (simulating bridge initialization)
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            self.isLoading = false
        }
    }
    
    func reloadBridge() {
        isLoading = true
        
        // Simulate bridge reload
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            self.isLoading = false
        }
        
        print("🔄 Bridge reloaded via SwiftUI")
    }
    
    func showDebugInfo() {
        debugMessage = """
        TonConnect Bridge Status
        
        Bridge: \(bridge != nil ? "✅ Active" : "❌ Inactive")
        WebView: \(bridge?.view != nil ? "✅ Loaded" : "❌ Not Loaded")
        Loading: \(isLoading ? "🔄 In Progress" : "✅ Complete")
        
        SwiftUI Integration: ✅ Active
        Bridge Version: 1.0.0
        """
        
        showingDebugAlert = true
    }
}

// MARK: - Preview
struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}

