//
//  MainViewModel.swift
//  TONWalletApp
//
//  Created by Nikita Rodionov on 06.10.2025.
//

import Foundation
import TONWalletKit

@MainActor
class MainViewModel: ObservableObject {
    @Published var state: State = .loading
    
    private let storage = WalletsStorage()
    
    func load() async {
        do {
            let wallets = try storage.wallets()
            
            var tonWallets: [TONWallet] = []
            
            for wallet in wallets {
                let tonWallet = try await TONWallet.add(data: wallet.data)
                tonWallets.append(tonWallet)
            }
            
            if tonWallets.isEmpty {
                state = .addWallet
            } else {
                show(wallets: tonWallets)
            }
        } catch {
            state = .addWallet
        }
    }
    
    func show(wallets: [TONWallet]) {
        if wallets.isEmpty {
            return
        }
        
        let wallets = wallets.map { wallet in
            WalletViewModel(tonWallet: wallet)
        }
        
        let viewModel = walletsListViewModel()
        viewModel.add(wallets: wallets)
        
        state = .wallets(viewModel: viewModel)
    }

    func walletsListViewModel() -> WalletsListViewModel {
        switch state {
        case .loading, .addWallet:
            let viewModel = WalletsListViewModel(wallets: [])
            
            viewModel.onRemoveAll = { [weak self] in
                self?.state = .addWallet
            }
            return viewModel
        case .wallets(let viewModel):
            return viewModel
        }
    }
}

extension MainViewModel {
    
    enum State {
        case loading
        case addWallet
        case wallets(viewModel: WalletsListViewModel)
        
        var isLoading: Bool {
            switch self {
            case .loading:
                return true
            default:
                return false
            }
        }
    }
}
