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
        .alert(isPresented: $viewModel.alertPresented) { () -> Alert in
            switch viewModel.approval {
            case .none:
                Alert(title: Text("Incorrect event"))
            case .connection:
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
            case .transaction:
                Alert(
                    title: Text("dApp wants to perform transaction"),
                    primaryButton: .default(
                        Text("Approve"),
                        action: { viewModel.approveTransaction() }
                    ),
                    secondaryButton: .default(
                        Text("Reject"),
                        action: { viewModel.rejectTransaction() }
                    )
                )
            }
            
        }
    }
}
