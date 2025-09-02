//
//  WalletCard.swift
//  Wallet display card component
//

import SwiftUI

struct WalletCard: View {
    let wallet: WalletInfo
    let walletKit: TonWalletKitSwift
    
    @State private var showingWalletDetails = false
    @State private var showingDeleteConfirmation = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(wallet.walletName)
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    Text(wallet.network == .mainnet ? "Mainnet" : "Testnet")
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(wallet.network == .mainnet ? .green : .orange)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background((wallet.network == .mainnet ? Color.green : Color.orange).opacity(0.1))
                        .cornerRadius(4)
                }
                
                Spacer()
                
                Menu {
                    Button("View Details") {
                        showingWalletDetails = true
                    }
                    
                    Button("Delete Wallet", role: .destructive) {
                        showingDeleteConfirmation = true
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .foregroundColor(.secondary)
                }
            }
            
            // Address
            VStack(alignment: .leading, spacing: 4) {
                Text("Address")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.secondary)
                
                HStack {
                    Text(formattedAddress)
                        .font(.system(.footnote, design: .monospaced))
                        .foregroundColor(.primary)
                    
                    Spacer()
                    
                    Button(action: copyAddress) {
                        Image(systemName: "doc.on.doc")
                            .foregroundColor(.blue)
                    }
                }
            }
            
            // Balance (if available)
            if let balance = wallet.balance {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Balance")
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(.secondary)
                    
                    Text("\(formatBalance(balance)) TON")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.primary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 1, x: 0, y: 1)
        .sheet(isPresented: $showingWalletDetails) {
            WalletDetailsView(wallet: wallet, walletKit: walletKit)
        }
        .alert("Delete Wallet", isPresented: $showingDeleteConfirmation) {
            Button("Cancel", role: .cancel) {}
            Button("Delete", role: .destructive) {
                deleteWallet()
            }
        } message: {
            Text("Are you sure you want to delete '\(wallet.walletName)'? This action cannot be undone.")
        }
    }
    
    private var formattedAddress: String {
        let address = wallet.address
        if address.count > 12 {
            return "\(address.prefix(6))...\(address.suffix(6))"
        }
        return address
    }
    
    private func formatBalance(_ balance: String) -> String {
        guard let balanceValue = Double(balance) else { return balance }
        let tonBalance = balanceValue / 1_000_000_000 // Convert nanotons to TON
        return String(format: "%.4f", tonBalance)
    }
    
    private func copyAddress() {
        UIPasteboard.general.string = wallet.address
        // Could add haptic feedback or toast notification here
    }
    
    private func deleteWallet() {
        Task {
            do {
                try await walletKit.removeWallet(wallet)
            } catch {
                print("Failed to delete wallet: \(error)")
            }
        }
    }
}

struct WalletDetailsView: View {
    let wallet: WalletInfo
    let walletKit: TonWalletKitSwift
    
    @Environment(\.dismiss) private var dismiss
    @State private var jettons: [JettonInfo] = []
    @State private var isLoadingJettons = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Wallet Info Section
                    walletInfoSection
                    
                    // Jettons Section
                    jettonsSection
                }
                .padding()
            }
            .navigationTitle(wallet.walletName)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
        .task {
            await loadJettons()
        }
    }
    
    private var walletInfoSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Wallet Information")
                .font(.headline)
                .fontWeight(.semibold)
            
            VStack(spacing: 12) {
                InfoRow(title: "Name", value: wallet.walletName)
                InfoRow(title: "Address", value: wallet.address, isMonospace: true)
                InfoRow(title: "Network", value: wallet.network == .mainnet ? "Mainnet" : "Testnet")
                InfoRow(title: "Version", value: wallet.version)
                
                if let publicKey = wallet.publicKey {
                    InfoRow(title: "Public Key", value: publicKey, isMonospace: true)
                }
                
                if let balance = wallet.balance {
                    InfoRow(title: "Balance", value: "\(formatBalance(balance)) TON")
                }
            }
        }
        .padding()
        .background(Color(.systemGroupedBackground))
        .cornerRadius(12)
    }
    
    private var jettonsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Jettons")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                if isLoadingJettons {
                    ProgressView()
                        .scaleEffect(0.8)
                }
                
                Spacer()
                
                Button("Refresh") {
                    Task { await loadJettons() }
                }
                .font(.subheadline)
            }
            
            if jettons.isEmpty && !isLoadingJettons {
                Text("No jettons found")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            } else {
                LazyVStack(spacing: 8) {
                    ForEach(jettons) { jetton in
                        JettonRow(jetton: jetton)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemGroupedBackground))
        .cornerRadius(12)
    }
    
    private func formatBalance(_ balance: String) -> String {
        guard let balanceValue = Double(balance) else { return balance }
        let tonBalance = balanceValue / 1_000_000_000
        return String(format: "%.4f", tonBalance)
    }
    
    private func loadJettons() async {
        isLoadingJettons = true
        defer { isLoadingJettons = false }
        
        do {
            jettons = try await walletKit.getJettons(for: wallet)
        } catch {
            print("Failed to load jettons: \(error)")
        }
    }
}

struct InfoRow: View {
    let title: String
    let value: String
    let isMonospace: Bool
    
    init(title: String, value: String, isMonospace: Bool = false) {
        self.title = title
        self.value = value
        self.isMonospace = isMonospace
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(.secondary)
            
            HStack {
                Text(value)
                    .font(isMonospace ? .system(.footnote, design: .monospaced) : .footnote)
                    .foregroundColor(.primary)
                    .textSelection(.enabled)
                
                Spacer()
                
                Button(action: {
                    UIPasteboard.general.string = value
                }) {
                    Image(systemName: "doc.on.doc")
                        .foregroundColor(.blue)
                        .font(.caption)
                }
            }
        }
    }
}

struct JettonRow: View {
    let jetton: JettonInfo
    
    var body: some View {
        HStack {
            // Jetton icon placeholder
            Circle()
                .fill(Color.gray.opacity(0.3))
                .frame(width: 40, height: 40)
                .overlay {
                    if let imageUrl = jetton.imageUrl, !imageUrl.isEmpty {
                        // In a real implementation, you'd use AsyncImage here
                        Image(systemName: "photo")
                            .foregroundColor(.gray)
                    } else {
                        Text(String(jetton.symbol.prefix(2)))
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.gray)
                    }
                }
            
            VStack(alignment: .leading, spacing: 2) {
                HStack {
                    Text(jetton.name)
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    if jetton.verified {
                        Image(systemName: "checkmark.seal.fill")
                            .foregroundColor(.blue)
                            .font(.caption)
                    }
                }
                
                Text(jetton.symbol)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 2) {
                Text(formatJettonBalance(jetton.balance, decimals: jetton.decimals))
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Text(jetton.symbol)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
    
    private func formatJettonBalance(_ balance: String, decimals: Int) -> String {
        guard let balanceValue = Double(balance) else { return balance }
        let divisor = pow(10.0, Double(decimals))
        let formattedBalance = balanceValue / divisor
        
        if formattedBalance >= 1 {
            return String(format: "%.2f", formattedBalance)
        } else {
            return String(format: "%.6f", formattedBalance)
        }
    }
}

struct WalletCard_Previews: PreviewProvider {
    static var previews: some View {
        let wallet = WalletInfo(
            address: "EQD_V9j8p5rQNPx0eK9-2j7J4WROUbm1tFNVzVlzCq-wgmKk",
            walletName: "My Wallet",
            network: .mainnet,
            version: "v5r1",
            balance: "1500000000"
        )
        
        WalletCard(
            wallet: wallet,
            walletKit: TonWalletKitSwift(config: WalletKitConfig(manifestUrl: ""))
        )
        .padding()
        .previewLayout(.sizeThatFits)
    }
}
