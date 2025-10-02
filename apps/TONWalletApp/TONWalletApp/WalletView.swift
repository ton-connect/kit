//
//  WalletView.swift
//  TONWalletApp
//
//  Created by Nikita Rodionov on 12.09.2025.
//

import Foundation
import SwiftUI
import TONWalletKit

@MainActor
class WalletViewModel: Identifiable, ObservableObject {
    let id = UUID()
    let tonWallet: TONWallet

    @Published private(set) var address: String?
    @Published private(set) var balance: String?
    
    init(tonWallet: TONWallet) {
        self.tonWallet = tonWallet
    }
    
    func load() async {
        do {
            address = try await tonWallet.address()
            balance = try await tonWallet.balance().map { "\($0)" }
        } catch {
            debugPrint(error.localizedDescription)
        }
    }
    
    func copyAddress() {
        UIPasteboard.general.string = address
    }
}

struct WalletView: View {
    @ObservedObject var viewModel: WalletViewModel
    
    var body: some View {
        VStack(spacing: 8.0) {
            Text("BALANCE")
                .font(.headline)
                .foregroundStyle(.gray)
            Text(viewModel.balance ?? "")
                .font(.largeTitle)
            
            VStack(spacing: 16.0) {
                HStack {
                    Text("ADDRESS")
                        .font(.caption)
                        .foregroundStyle(.gray)
                    
                    Spacer()
                    
                    Button("Copy") {
                        viewModel.copyAddress()
                    }
                    .buttonStyle(TONLinkButtonStyle(type: .secondary))
                }
                
                Text(viewModel.address ?? "")
                    .multilineTextAlignment(.center)
                    .font(.callout)
            }
            .padding(16.0)
            .background(Color.gray.opacity(0.1))
            .cornerRadius(8.0)
            
            Spacer()
        }
        .padding(16.0)
        .task {
            await viewModel.load()
        }
    }
}
