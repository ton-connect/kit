//
//  WalletDAppConnectionViewModel.swift
//  TONWalletApp
//
//  Created by Nikita Rodionov on 30.09.2025.
//

import Foundation
import Combine
import TONWalletKit

@MainActor
class WalletDAppConnectionViewModel: ObservableObject {
    let wallet: TONWallet
    
    @Published var link = ""
    @Published var isConnecting = false
    @Published var approvalPresented = false
    
    var connectionEvent: ConnectRequestEvent?
    
    private var subscribers = Set<AnyCancellable>()
    
    init(wallet: TONWallet) {
        self.wallet = wallet
    }
    
    func connect() {
        subscribers.removeAll()
        
        TONEventsHandler.shared.events
            .receive(on: DispatchQueue.main)
            .sink { [weak self] event in
                switch event {
                case .connectRequest(let event):
                    self?.connectionEvent = event
                    self?.approvalPresented = true
                default: ()
                }
            }
            .store(in: &subscribers)
        
        isConnecting = true
        
        Task {
            do {
                try await wallet.connect(url: link)
            } catch {
                debugPrint(error.localizedDescription)
                isConnecting = false
            }
        }
    }
    
    func approveConnection() {
        approvalPresented = false
        
        guard let connectionEvent else {
            return
        }
        
        self.connectionEvent = nil
        
        Task {
            do {
                try await wallet.approve(connectionRequest: connectionEvent)
            } catch {
                debugPrint(error.localizedDescription)
            }
            isConnecting = false
        }
    }
    
    func rejectConnection() {
        approvalPresented = false
        
        guard let connectionEvent else {
            return
        }
        
        self.connectionEvent = nil
        
        Task {
            do {
                try await wallet.reject(connectionRequest: connectionEvent)
            } catch {
                debugPrint(error.localizedDescription)
            }
            isConnecting = false
        }
    }
}
