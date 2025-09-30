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
    
    init(tonWallet: TONWallet) {
        self.tonWallet = tonWallet
        
        self.info = WalletInfoViewModel(wallet: tonWallet)
        self.dAppConnection = WalletDAppConnectionViewModel(wallet: tonWallet)
    }
}
