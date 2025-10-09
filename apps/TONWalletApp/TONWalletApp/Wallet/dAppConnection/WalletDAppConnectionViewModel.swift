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
    @Published var alertPresented = false
    
    var approval: Approval? {
        didSet {
            alertPresented = approval != nil
        }
    }
    
    var connectionRequest: TONWalletConnectionRequest? {
        didSet {
            if connectionRequest == nil {
                if approval == .connection {
                    approval = nil
                }
            } else {
                if approval == nil {
                    approval = .connection
                }
            }
        }
    }
    
    private var subscribers = Set<AnyCancellable>()
    
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
                isConnecting = false
            }
        }
    }
    
    func waitForEvent() {
        subscribers.removeAll()
        
        TONEventsHandler.shared.events
            .receive(on: DispatchQueue.main)
            .sink { [weak self] event in
                switch event {
                case .connectRequest(let event):
                    self?.connectionRequest = event
                default: ()
                }
            }
            .store(in: &subscribers)
    }
    
    func approveConnection() {
        guard let connectionRequest, let address = wallet.address else {
            return
        }
        
        Task { [weak self] in
            do {
                try await connectionRequest.approve(walletAddress: address)
            } catch {
                debugPrint(error.localizedDescription)
            }
            self?.connectionRequest = nil
            self?.isConnecting = false
        }
    }
    
    func rejectConnection() {
        guard let connectionRequest else {
            return
        }
        
        Task { [weak self] in
            do {
                try await connectionRequest.reject(reason: "Test reason")
            } catch {
                debugPrint(error.localizedDescription)
            }
            self?.connectionRequest = nil
            self?.isConnecting = false
        }
    }
}

extension WalletDAppConnectionViewModel {
    
    enum Approval {
        case connection
    }
}
