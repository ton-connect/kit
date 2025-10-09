//
//  WalletViewModel.swift
//  TONWalletApp
//
//  Created by Nikita Rodionov on 30.09.2025.
//

import TONWalletKit

@MainActor
class WalletViewModel: Identifiable, ObservableObject {
    let id = UUID()

    let tonWallet: TONWallet
    
    let info: WalletInfoViewModel
    let dAppConnection: WalletDAppConnectionViewModel
    let dAppDisconnect: WalletDAppDisconnectionViewModel
    
    private let storage = WalletsStorage()
    
    var onRemove: (() -> Void)?
    
    init(
        tonWallet: TONWallet
    ) {
        self.tonWallet = tonWallet
        
        self.info = WalletInfoViewModel(wallet: tonWallet)
        self.dAppConnection = WalletDAppConnectionViewModel(wallet: tonWallet)
        self.dAppDisconnect = WalletDAppDisconnectionViewModel(wallet: tonWallet)
    }
    
    func remove() {
        do {
            try storage.remove(walletAddress: tonWallet.address)
            
            Task {
                try await tonWallet.remove()
            }
            
            onRemove?()
        } catch {
            debugPrint(error.localizedDescription)
        }
    }
}
