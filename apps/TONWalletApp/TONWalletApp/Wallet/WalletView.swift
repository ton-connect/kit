//
//  WalletView.swift
//  TONWalletApp
//
//  Created by Nikita Rodionov on 12.09.2025.
//

import Foundation
import SwiftUI

struct WalletView: View {
    @StateObject var viewModel: WalletViewModel
    
    var body: some View {
        ScrollView {
            VStack(spacing: 16.0) {
                WalletInfoView(viewModel: viewModel.info)
                    .widget()
                
                WalletDAppConnectionView(viewModel: viewModel.dAppConnection)
                    .widget()
            }
            .padding(16.0)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .background(Color.backgroundColor)
        .navigationTitle("TON Wallet")
    }
}
