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
    let bridgeConnection: WalletBridgeConnectionViewModel
    
    init(tonWallet: TONWallet) {
        self.tonWallet = tonWallet
        
        self.info = WalletInfoViewModel(wallet: tonWallet)
        self.bridgeConnection = WalletBridgeConnectionViewModel(wallet: tonWallet)
    }
}
