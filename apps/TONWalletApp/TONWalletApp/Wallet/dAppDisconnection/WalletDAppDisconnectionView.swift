//
//  WalletDAppDisconnectionView.swift
//  TONWalletApp
//
//  Created by Nikita Rodionov on 03.10.2025.
//

import SwiftUI
import TONWalletKit

struct WalletDAppDisconnectionView: View {
    @ObservedObject var viewModel: WalletDAppDisconnectionViewModel
    
    var body: some View {
        VStack(spacing: 8.0) {
            ForEach(0..<viewModel.events.count, id: \.self) { index in
                DisconnectEventView(event: viewModel.events[index]) {
                    viewModel.removeEvent(at: index)
                }
            }
        }
        .background(.clear)
        .onAppear {
            viewModel.connect()
        }
    }
}

private struct DisconnectEventView: View {
    let event: DisconnectEvent
    
    let onDismiss: (() -> Void)?
    
    var body: some View {
        
        HStack(spacing: 4.0) {
            VStack(alignment: .leading, spacing: AppSpacing.spacing(2.0)) {
                Text("Session Disconnected")
                    .textSM()
                    .foregroundColor(Color.TON.yellow800)
                
                Text(event.walletAddress ?? "")
                    .textXS()
                    .foregroundColor(Color.TON.yellow700)
            }
            
            Spacer()
            
            VStack(alignment: .trailing) {
                Button(action: { onDismiss?() }) {
                    Text("Dismiss")
                        .textSM()
                        .foregroundColor(Color.TON.yellow800)
                        .padding(AppSpacing.spacing(2.0))
                        .background(Color.TON.gray200)
                        .clipShape(RoundedRectangle(cornerRadius: AppRadius.standard))

                }
                Spacer()
            }
        }
        .frame(maxWidth: .infinity)
        .widget(style: .block(.warning))
    }
}
