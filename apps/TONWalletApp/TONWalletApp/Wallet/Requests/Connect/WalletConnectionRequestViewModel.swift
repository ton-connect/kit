//
//  WalletConnectionRequestViewModel.swift
//  TONWalletApp
//
//  Created by Nikita Rodionov on 03.10.2025.
//

import Foundation
import TONWalletKit

@MainActor
class WalletConnectionRequestViewModel: ObservableObject {
    private let wallet: TONWallet
    private let request: TONWalletConnectionRequest
    
    var dAppInfo: DAppInfo? { request.dAppInfo }
    var permissions: [ConnectRequestEvent.Preview.ConnectPermission] { request.permissions }
    
    init(request: TONWalletConnectionRequest, wallet: TONWallet) {
        self.request = request
        self.wallet = wallet
    }
    
    func approve() {
        guard let address = wallet.address else {
            return
        }
        
        Task {
            do {
                try await request.approve(walletAddress: address)
            } catch {
                debugPrint(error.localizedDescription)
            }
        }
    }
    
    func reject() {
        Task {
            do {
                try await request.reject()
            } catch {
                debugPrint(error.localizedDescription)
            }
        }
    }
}
