//
//  WalletConnectionRequestView.swift
//  TONWalletApp
//
//  Created by Nikita Rodionov on 03.10.2025.
//

import SwiftUI

struct WalletConnectionRequestView: View {
    @StateObject var viewModel: WalletConnectionRequestViewModel
    
    var body: some View {
        VStack(spacing: AppSpacing.spacing(4.0)) {
            VStack(spacing: AppSpacing.spacing(2.0)) {
                Text("Connect Request")
                    .textXL(weight: .bold)
                    .foregroundColor(Color.TON.gray900)
                
                Text("A dApp wants to connect to your wallet")
                    .textSM()
                    .foregroundColor(Color.TON.gray600)
            }
            
            if let dAppInfo = viewModel.dAppInfo {
                DAppView(dAppInfo: dAppInfo)
            }
            
            if !viewModel.permissions.isEmpty {
                VStack(alignment: .leading, spacing: 8.0) {
                    Text("Requested Permissions:")
                        .textLG(weight: .medium)
                        .foregroundStyle(Color.TON.gray900)
                    
                    ForEach(0..<viewModel.permissions.count, id: \.self) { index in
                        let permission = viewModel.permissions[index]
                        
                        VStack(alignment: .leading, spacing: AppSpacing.spacing(2.0)) {
                            Text(permission.title ?? "")
                                .textSM(weight: .medium)
                                .foregroundStyle(Color.TON.gray900)
                            
                            Text(permission.description ?? "")
                                .textXS()
                                .foregroundStyle(Color.TON.gray600)
                                .multilineTextAlignment(.leading)
                        }
                        .widget(style: .block(.regular))
                    }
                }
            }
            
            Text("Only connect to trusted applications. This will give the dApp access to your wallet address and allow it to request transactions.")
                .textSM()
                .foregroundStyle(Color.TON.yellow800)
                .multilineTextAlignment(.leading)
                .widget(style: .block(.warning))
            
            HStack(spacing: AppSpacing.spacing(2.0)) {
                Button("Reject") {
                    viewModel.reject()
                }
                .buttonStyle(TONLinkButtonStyle(type: .secondary))
                
                Button("Connect") {
                    viewModel.approve()
                }
                .buttonStyle(TONLinkButtonStyle(type: .primary))
            }
        }
        .padding(AppSpacing.spacing(4.0))
    }
}
