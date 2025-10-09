//
//  MainView.swift
//  TONWalletApp
//
//  Created by Nikita Rodionov on 06.10.2025.
//

import SwiftUI

struct MainView: View {
    @StateObject private var viewModel = MainViewModel()
    
    var body: some View {
        Group {
            switch viewModel.state {
            case .loading:
                ProgressView()
                    .task {
                        await viewModel.load()
                    }
            case .addWallet:
                AddWalletView() {
                    viewModel.show(wallets: [$0])
                }
            case .wallets(let viewModel):
                WalletsListView(viewModel: viewModel)
            }
        }
    }
}
