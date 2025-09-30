//
//  WalletDAppConnectionViewModel.swift
//  TONWalletApp
//
//  Created by Nikita Rodionov on 30.09.2025.
//

import SwiftUI
import TONWalletKit

@MainActor
class WalletDAppConnectionViewModel: ObservableObject {
    let wallet: TONWallet
    
    @Published var link = ""
    @Published var isConnecting = false
    
    init(wallet: TONWallet) {
        self.wallet = wallet
    }
    
    func connect() {
        isConnecting = true
        
        Task {
            do {
                try await wallet.connect(url: link)
            } catch {
                debugPrint(error.localizedDescription)
            }
            isConnecting = false
        }
    }
}
