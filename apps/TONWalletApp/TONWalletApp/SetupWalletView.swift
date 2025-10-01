//
//  SetupWalletView.swift
//  TONWalletApp
//
//  Created by Nikita Rodionov on 12.09.2025.
//

import Foundation
import Combine
import SwiftUI
import TONWalletKit

@MainActor
struct SetupWalletView: View {
    @State var initialized = false
    @State var mnemonic = TONMnemonic()
    @State var wallet: TONWallet?
    
    @State var walletIsImporting = false
    @State var walletIsCreating = false
    @State var walletIsPresented = false
    
    var body: some View {
        if initialized {
            VStack {
                VStack(spacing: 8.0) {
                    Text("Setup Wallet")
                        .font(.title)
                    Text("Create a new wallet or import an existing one.")
                        .font(.subheadline)
                }
                
                MnemonicInputView(mnemonic: $mnemonic)
                    .allowsHitTesting(!walletIsImporting)
                
                HStack(spacing: 16.0) {
                    Button("Clear all") {
                        mnemonic = TONMnemonic()
                    }
                    .buttonStyle(TONLinkButtonStyle(type: .secondary))
                    
                    Button("Paste from Clipboard") {
                        if let string = UIPasteboard.general.string {
                            mnemonic = TONMnemonic(string: string)
                        }
                    }
                    .buttonStyle(TONLinkButtonStyle(type: .primary))
                }
                
                Spacer()
                
                VStack {
                    Button("Create New Wallet") {
                        
                    }
                    .buttonStyle(TONButtonStyle(type: .primary))
                    
                    Text("Generate a new 24-word recovery phrase")
                        .foregroundStyle(.gray)
                        .font(.caption)
                }

                VStack {
                    Button("Import Wallet") {
                        loadWallet()
                    }
                    .buttonStyle(TONButtonStyle(type: .secondary, isLoading: walletIsImporting))
                    .disabled(!mnemonic.isFilled)
                    
                    Text("Restore wallet using recovery phrase")
                        .foregroundStyle(.gray)
                        .font(.caption)
                }
            }
            .padding(.horizontal, 16.0)
            .navigationDestination(isPresented: $walletIsPresented) {
                if let wallet {
                    WalletView(viewModel: .init(tonWallet: wallet))
                }
            }

        } else {
            ProgressView()
                .task {
                    do {
                        try await TONWalletKit.initialize(configuration: WalletKitConfig(
                            network: .mainnet,
                            storage: .memory,
                            bridgeUrl: "https://walletbot.me/tonconnect-bridge/bridge"
                        ), eventsHandler: TONEventsHandler.shared)
                        initialized = true
                    } catch {
                        debugPrint(error.localizedDescription)
                    }
                }
        }
    }
    
    private func loadWallet() {
        walletIsImporting = true
        
        Task {
            do {
                let wallet = try await TONWallet.add(
                    data: TONWalletData(
                        mnemonic: mnemonic,
                        name: "Test",
                        network: .mainnet
                    )
                )
                self.wallet = wallet
                self.walletIsPresented = true
            } catch {
                debugPrint(error.localizedDescription)
            }
            
            walletIsImporting = false
        }
    }
    
    private func createWallet() {
        
    }
}

class TONEventsHandler: TONBridgeEventsHandler {
    let events = PassthroughSubject<WalletKitEvent, Never>()
    
    static let shared = TONEventsHandler()
    
    private init() {}
    
    func handle(event: WalletKitEvent) {
        events.send(event)
    }
}
