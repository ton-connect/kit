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
    
    var address: String? { wallet.address }
    
    @Published private(set) var balance: String?
    
    init(wallet: TONWallet) {
        self.wallet = wallet
    }
    
    func load() async {
        do {
            balance = try await wallet.balance()
        } catch {
            debugPrint(error.localizedDescription)
        }
    }
}
