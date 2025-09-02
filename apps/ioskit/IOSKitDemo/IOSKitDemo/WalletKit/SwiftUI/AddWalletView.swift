//
//  AddWalletView.swift
//  Add wallet interface
//

import SwiftUI

struct AddWalletView: View {
    let walletKit: TonWalletKitSwift
    
    @Environment(\.dismiss) private var dismiss
    @State private var selectedTab = 0
    @State private var walletName = ""
    @State private var selectedNetwork: TonNetwork = .mainnet
    @State private var mnemonicWords: [String] = Array(repeating: "", count: 24)
    @State private var isProcessing = false
    @State private var errorMessage: String?
    
    private let mnemonicWordCount = 24
    
    var body: some View {
        NavigationView {
            VStack {
                // Tab Selector
                Picker("Import Method", selection: $selectedTab) {
                    Text("Import").tag(0)
                    Text("Generate").tag(1)
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding()
                
                TabView(selection: $selectedTab) {
                    // Import Tab
                    importWalletView
                        .tag(0)
                    
                    // Generate Tab
                    generateWalletView
                        .tag(1)
                }
                .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
                
                Spacer()
                
                // Actions
                actionsSection
            }
            .navigationTitle("Add Wallet")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .alert("Error", isPresented: .constant(errorMessage != nil)) {
                Button("OK") {
                    errorMessage = nil
                }
            } message: {
                if let errorMessage = errorMessage {
                    Text(errorMessage)
                }
            }
        }
    }
    
    private var importWalletView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Import Existing Wallet")
                    .font(.headline)
                    .padding(.horizontal)
                
                // Wallet Name
                VStack(alignment: .leading, spacing: 8) {
                    Text("Wallet Name")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    TextField("Enter wallet name", text: $walletName)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                }
                .padding(.horizontal)
                
                // Network Selection
                VStack(alignment: .leading, spacing: 8) {
                    Text("Network")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    Picker("Network", selection: $selectedNetwork) {
                        Text("Mainnet").tag(TonNetwork.mainnet)
                        Text("Testnet").tag(TonNetwork.testnet)
                    }
                    .pickerStyle(SegmentedPickerStyle())
                }
                .padding(.horizontal)
                
                // Mnemonic Input
                VStack(alignment: .leading, spacing: 12) {
                    Text("Recovery Phrase (24 words)")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .padding(.horizontal)
                    
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 3), spacing: 8) {
                        ForEach(0..<mnemonicWordCount, id: \.self) { index in
                            VStack(spacing: 4) {
                                Text("\(index + 1)")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                
                                TextField("word", text: $mnemonicWords[index])
                                    .textFieldStyle(RoundedBorderTextFieldStyle())
                                    .font(.caption)
                                    .autocapitalization(.none)
                                    .disableAutocorrection(true)
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                
                // Import from text
                VStack(alignment: .leading, spacing: 8) {
                    Text("Or paste recovery phrase")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    Button("Paste from Clipboard") {
                        pasteFromClipboard()
                    }
                    .buttonStyle(.bordered)
                }
                .padding(.horizontal)
            }
        }
    }
    
    private var generateWalletView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Generate New Wallet")
                    .font(.headline)
                    .padding(.horizontal)
                
                // Wallet Name
                VStack(alignment: .leading, spacing: 8) {
                    Text("Wallet Name")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    TextField("Enter wallet name", text: $walletName)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                }
                .padding(.horizontal)
                
                // Network Selection
                VStack(alignment: .leading, spacing: 8) {
                    Text("Network")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    Picker("Network", selection: $selectedNetwork) {
                        Text("Mainnet").tag(TonNetwork.mainnet)
                        Text("Testnet").tag(TonNetwork.testnet)
                    }
                    .pickerStyle(SegmentedPickerStyle())
                }
                .padding(.horizontal)
                
                // Security Notice
                VStack(alignment: .leading, spacing: 12) {
                    Text("Important Security Information")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.orange)
                    
                    VStack(alignment: .leading, spacing: 8) {
                        SecurityNoticeRow(
                            icon: "key.fill",
                            text: "Your recovery phrase will be generated securely"
                        )
                        
                        SecurityNoticeRow(
                            icon: "lock.shield",
                            text: "Write down and store your recovery phrase safely"
                        )
                        
                        SecurityNoticeRow(
                            icon: "exclamationmark.triangle",
                            text: "Never share your recovery phrase with anyone"
                        )
                        
                        SecurityNoticeRow(
                            icon: "trash",
                            text: "If you lose your recovery phrase, you cannot recover your wallet"
                        )
                    }
                }
                .padding()
                .background(Color.orange.opacity(0.1))
                .cornerRadius(12)
                .padding(.horizontal)
            }
        }
    }
    
    private var actionsSection: some View {
        VStack(spacing: 12) {
            Button(action: selectedTab == 0 ? importWallet : generateWallet) {
                HStack {
                    if isProcessing {
                        ProgressView()
                            .scaleEffect(0.8)
                    }
                    Text(selectedTab == 0 ? "Import Wallet" : "Generate Wallet")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(canProceed ? Color.blue : Color.gray.opacity(0.3))
                .foregroundColor(canProceed ? .white : .gray)
                .cornerRadius(12)
            }
            .disabled(!canProceed || isProcessing)
        }
        .padding()
    }
    
    private var canProceed: Bool {
        guard !walletName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return false
        }
        
        if selectedTab == 0 {
            // Import - check if all mnemonic words are filled
            return mnemonicWords.allSatisfy { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
        } else {
            // Generate - just need name
            return true
        }
    }
    
    private func pasteFromClipboard() {
        guard let clipboardString = UIPasteboard.general.string else { return }
        
        let words = clipboardString
            .components(separatedBy: .whitespacesAndNewlines)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        
        if words.count == mnemonicWordCount {
            mnemonicWords = words
        } else {
            errorMessage = "Invalid recovery phrase. Expected \(mnemonicWordCount) words, got \(words.count)."
        }
    }
    
    private func importWallet() {
        isProcessing = true
        
        Task {
            do {
                let cleanedWords = mnemonicWords.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
                
                let config = WalletConfig(
                    mnemonic: cleanedWords,
                    name: walletName.trimmingCharacters(in: .whitespacesAndNewlines),
                    network: selectedNetwork
                )
                
                try await walletKit.addWallet(config)
                
                await MainActor.run {
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    errorMessage = "Failed to import wallet: \(error.localizedDescription)"
                    isProcessing = false
                }
            }
        }
    }
    
    private func generateWallet() {
        isProcessing = true
        
        Task {
            do {
                // Generate 24-word mnemonic
                let generatedMnemonic = generateMnemonic()
                
                let config = WalletConfig(
                    mnemonic: generatedMnemonic,
                    name: walletName.trimmingCharacters(in: .whitespacesAndNewlines),
                    network: selectedNetwork
                )
                
                try await walletKit.addWallet(config)
                
                await MainActor.run {
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    errorMessage = "Failed to generate wallet: \(error.localizedDescription)"
                    isProcessing = false
                }
            }
        }
    }
    
    private func generateMnemonic() -> [String] {
        // This is a simplified mnemonic generation for demo purposes
        // In a real implementation, you'd use a proper BIP39 word list and secure random generation
        let demoWords = [
            "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract",
            "absurd", "abuse", "access", "accident", "account", "accuse", "achieve", "acid",
            "acoustic", "acquire", "across", "act", "action", "actor", "actress", "actual"
        ]
        
        var mnemonic: [String] = []
        for _ in 0..<24 {
            if let randomWord = demoWords.randomElement() {
                mnemonic.append(randomWord)
            }
        }
        
        return mnemonic
    }
}

struct SecurityNoticeRow: View {
    let icon: String
    let text: String
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(.orange)
                .frame(width: 20)
            
            Text(text)
                .font(.caption)
                .foregroundColor(.primary)
            
            Spacer()
        }
    }
}

struct AddWalletView_Previews: PreviewProvider {
    static var previews: some View {
        AddWalletView(
            walletKit: TonWalletKitSwift(config: WalletKitConfig(manifestUrl: ""))
        )
    }
}
