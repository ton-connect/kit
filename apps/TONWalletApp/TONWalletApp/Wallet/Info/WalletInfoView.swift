//
//  WalletInfoView.swift
//  TONWalletApp
//
//  Created by Nikita Rodionov on 30.09.2025.
//

import SwiftUI

struct WalletInfoView: View {
    @ObservedObject var viewModel: WalletInfoViewModel
    
    var body: some View {
        VStack(spacing: 8.0) {
            Text("BALANCE")
                .font(.headline)
                .foregroundStyle(.gray)
            Text(viewModel.balance ?? "")
                .font(.largeTitle)
            
            VStack(spacing: 8.0) {
                HStack {
                    Text("ADDRESS")
                        .font(.caption)
                        .foregroundStyle(.gray)
                    
                    Spacer()
                    
                    Button("Copy") {
                        UIPasteboard.general.string = viewModel.address
                    }
                    .buttonStyle(TONLinkButtonStyle(type: .secondary))
                }
                
                Text(viewModel.address)
                    .multilineTextAlignment(.center)
                    .font(.callout)
            }
            .padding(16.0)
            .background(Color.gray.opacity(0.1))
            .cornerRadius(AppRadius.standard)
        }
        .task {
            await viewModel.load()
        }
    }
}
