//
//  WalletDAppConnectionView.swift
//  TONWalletApp
//
//  Created by Nikita Rodionov on 30.09.2025.
//

import SwiftUI

struct WalletDAppConnectionView: View {
    @ObservedObject var viewModel: WalletDAppConnectionViewModel
    
    var body: some View {
        VStack(spacing: 8.0) {
            Text("Connect to dApp")
                .font(.headline)
            
            VStack(spacing: 4.0) {
                Text("Paste TON Connect Link")
                    .font(.caption)
                TextEditor(text: $viewModel.link)
                    .frame(height: 100.0)
            }
            
            Button("Connect to dApp") {
                self.viewModel.connect()
            }
            .buttonStyle(
                TONButtonStyle(
                    type: .primary,
                    isLoading: viewModel.isConnecting
                )
            )
            .disabled(viewModel.link.isEmpty)
        }
        .alert(isPresented: $viewModel.approvalPresented) { () -> Alert in
            Alert(
                title: Text("dApp wants to connect"),
                primaryButton: .default(
                    Text("Approve"),
                    action: { viewModel.approveConnection() }
                ),
                secondaryButton: .default(
                    Text("Reject"),
                    action: { viewModel.rejectConnection() }
                )
            )
        }
    }
}
