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
            VStack {
                Text("Disconnected")
                Text(event.sessionId ?? "")
            }
            Spacer()
            
            Button("Dismiss") {
                onDismiss?()
            }
        }
        .frame(maxWidth: .infinity)
        .padding(8.0)
    }
}
