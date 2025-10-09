//
//  WalletInfoViewModel.swift
//  TONWalletApp
//
//  Created by Nikita Rodionov on 30.09.2025.
//

import Foundation
import TONWalletKit

@MainActor
class WalletInfoViewModel: ObservableObject {
    let wallet: TONWallet
    
    var address: String { wallet.address ?? "Unknown address" }
    
    @Published private(set) var balance: String?
    
    init(wallet: TONWallet) {
        self.wallet = wallet
    }
    
    func load() async {
        if balance != nil { return }
        
        do {
            balance = try await wallet.balance() ?? "Unknown balance"
        } catch {
            debugPrint(error.localizedDescription)
        }
    }
}
