//
//  WalletKitView.swift
//  Native SwiftUI interface for WalletKit
//

import SwiftUI

/// Main WalletKit interface view
public struct WalletKitView: View {
    @StateObject private var walletKit: TonWalletKitSwift
    @State private var showingAddWallet = false
    @State private var showingConnectRequest: ConnectRequestEvent?
    @State private var showingTransactionRequest: TransactionRequestEvent?
    @State private var showingSignDataRequest: SignDataRequestEvent?
    @State private var showingURLInput = false
    @State private var urlToHandle = ""
    
    public init(config: WalletKitConfig) {
        self._walletKit = StateObject(wrappedValue: TonWalletKitSwift(config: config))
    }
    
    public var body: some View {
        NavigationView {
            VStack {
                if !walletKit.isInitialized {
                    initializationView
                } else {
                    mainContent
                }
            }
            .navigationTitle("TonWallet")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    if walletKit.isInitialized {
                        Button("Add Wallet") {
                            showingAddWallet = true
                        }
                    }
                }
            }
        }
        .sheet(isPresented: $showingAddWallet) {
            AddWalletView(walletKit: walletKit)
        }
        .sheet(item: $showingConnectRequest) { request in
            ConnectRequestView(request: request, walletKit: walletKit)
        }
        .sheet(item: $showingTransactionRequest) { request in
            TransactionRequestView(request: request, walletKit: walletKit)
        }
        .sheet(item: $showingSignDataRequest) { request in
            SignDataRequestView(request: request, walletKit: walletKit)
        }
        .alert("Handle TON Connect URL", isPresented: $showingURLInput) {
            TextField("Paste TON Connect URL", text: $urlToHandle)
            Button("Handle") {
                handleTonConnectURL()
            }
            Button("Cancel", role: .cancel) {}
        }
        .onAppear {
            setupEventHandlers()
            initializeWalletKit()
        }
    }
    
    private var initializationView: some View {
        VStack(spacing: 20) {
            ProgressView()
                .scaleEffect(1.5)
            
            Text("Initializing WalletKit...")
                .font(.headline)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private var mainContent: some View {
        VStack(spacing: 0) {
            // Quick Actions
            quickActionsCard
            
            // Wallets Section
            walletsSection
            
            // Sessions Section
            sessionsSection
            
            Spacer()
        }
    }
    
    private var quickActionsCard: some View {
        VStack(spacing: 16) {
            Text("Quick Actions")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            HStack(spacing: 12) {
                QuickActionButton(
                    title: "Handle URL",
                    icon: "link",
                    color: .blue
                ) {
                    showingURLInput = true
                }
                
                QuickActionButton(
                    title: "Add Wallet",
                    icon: "plus.circle",
                    color: .green
                ) {
                    showingAddWallet = true
                }
            }
        }
        .padding()
        .background(Color(.systemGroupedBackground))
        .cornerRadius(12)
        .padding(.horizontal)
        .padding(.top)
    }
    
    private var walletsSection: some View {
        VStack(spacing: 12) {
            SectionHeader(title: "Wallets", count: walletKit.wallets.count)
            
            if walletKit.wallets.isEmpty {
                EmptyStateView(
                    icon: "wallet.pass",
                    title: "No Wallets",
                    description: "Add a wallet to get started",
                    buttonTitle: "Add Wallet",
                    buttonAction: { showingAddWallet = true }
                )
            } else {
                LazyVStack(spacing: 8) {
                    ForEach(walletKit.wallets) { wallet in
                        WalletCard(wallet: wallet, walletKit: walletKit)
                    }
                }
                .padding(.horizontal)
            }
        }
        .padding(.top)
    }
    
    private var sessionsSection: some View {
        VStack(spacing: 12) {
            SectionHeader(title: "Active Sessions", count: walletKit.sessions.count)
            
            if walletKit.sessions.isEmpty {
                EmptyStateView(
                    icon: "network",
                    title: "No Active Sessions",
                    description: "Connect to dApps to see active sessions here"
                )
            } else {
                LazyVStack(spacing: 8) {
                    ForEach(walletKit.sessions) { session in
                        SessionCard(session: session, walletKit: walletKit)
                    }
                }
                .padding(.horizontal)
            }
        }
        .padding(.top)
    }
    
    private func setupEventHandlers() {
        walletKit.onConnectRequest = { request in
            showingConnectRequest = request
        }
        
        walletKit.onTransactionRequest = { request in
            showingTransactionRequest = request
        }
        
        walletKit.onSignDataRequest = { request in
            showingSignDataRequest = request
        }
        
        walletKit.onDisconnect = { event in
            // Handle disconnect event
            print("Session disconnected: \(event.sessionId)")
        }
    }
    
    private func initializeWalletKit() {
        Task {
            do {
                try await walletKit.initialize()
            } catch {
                print("Failed to initialize WalletKit: \(error)")
            }
        }
    }
    
    private func handleTonConnectURL() {
        guard !urlToHandle.isEmpty else { return }
        
        Task {
            do {
                try await walletKit.handleTonConnectUrl(urlToHandle)
                urlToHandle = ""
            } catch {
                print("Failed to handle TON Connect URL: \(error)")
            }
        }
    }
}

// MARK: - Supporting Views

struct QuickActionButton: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title2)
                
                Text(title)
                    .font(.caption)
                    .fontWeight(.medium)
            }
            .foregroundColor(color)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(color.opacity(0.1))
            .cornerRadius(8)
        }
    }
}

struct SectionHeader: View {
    let title: String
    let count: Int
    
    var body: some View {
        HStack {
            Text(title)
                .font(.headline)
                .fontWeight(.semibold)
            
            Text("(\(count))")
                .font(.headline)
                .foregroundColor(.secondary)
            
            Spacer()
        }
        .padding(.horizontal)
    }
}

struct EmptyStateView: View {
    let icon: String
    let title: String
    let description: String
    let buttonTitle: String?
    let buttonAction: (() -> Void)?
    
    init(
        icon: String,
        title: String,
        description: String,
        buttonTitle: String? = nil,
        buttonAction: (() -> Void)? = nil
    ) {
        self.icon = icon
        self.title = title
        self.description = description
        self.buttonTitle = buttonTitle
        self.buttonAction = buttonAction
    }
    
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 48))
                .foregroundColor(.secondary)
            
            Text(title)
                .font(.headline)
                .fontWeight(.semibold)
            
            Text(description)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            if let buttonTitle = buttonTitle,
               let buttonAction = buttonAction {
                Button(buttonTitle, action: buttonAction)
                    .buttonStyle(.borderedProminent)
            }
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(Color(.systemGroupedBackground))
        .cornerRadius(12)
        .padding(.horizontal)
    }
}

// MARK: - Preview

struct WalletKitView_Previews: PreviewProvider {
    static var previews: some View {
        WalletKitView(config: WalletKitConfig(
            manifestUrl: "https://example.com/manifest.json"
        ))
    }
}
