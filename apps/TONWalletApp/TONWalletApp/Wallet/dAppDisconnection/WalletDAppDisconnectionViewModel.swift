//
//  WalletDAppConnectionViewModel.swift
//  TONWalletApp
//
//  Created by Nikita Rodionov on 03.10.2025.
//

import Foundation
import Combine
import TONWalletKit

@MainActor
class WalletDAppDisconnectionViewModel: ObservableObject {
    @Published private(set) var events: [DisconnectEvent] = []
    
    let wallet: TONWallet
    
    private var subscribers: Set<AnyCancellable> = []
    
    init(wallet: TONWallet) {
        self.wallet = wallet
    }
    
    func removeEvent(at index: Int) {
        events.remove(at: index)
    }
    
    func connect() {
        subscribers.removeAll()
        
        TONEventsHandler.shared.events
            .receive(on: DispatchQueue.main)
            .sink { [weak self] event in
                switch event {
                case .disconnect(let event):
                    if event.walletAddress == self?.wallet.address {
                        self?.events.append(event)
                    }
                default: ()
                }
            }
            .store(in: &subscribers)
    }
}

extension DisconnectEvent: @retroactive Identifiable {}
