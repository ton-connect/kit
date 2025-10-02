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
    
    var transactionRequest: TONWalletTransactionRequest? {
        didSet {
            if transactionRequest == nil {
                if approval == .transaction {
                    approval = nil
                }
            } else {
                if approval == nil {
                    approval = .transaction
                }
            }
        }
    }
    
    var signDataRequest: TONWalletSignDataRequest? {
        didSet {
            if signDataRequest == nil {
                if approval == .signData {
                    approval = nil
                }
            } else {
                if approval == nil {
                    approval = .signData
                }
            }
        }
    }
    
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
                    self?.connectionRequest = event
                case .transactionRequest(let request):
                    self?.transactionRequest = request
                case .signDataRequest(let request):
                    self?.signDataRequest = request
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
    
    func approveTransaction() {
        guard let transactionRequest else {
            return
        }
        
        Task { [weak self] in
            do {
                try await transactionRequest.approve()
            } catch {
                debugPrint(error.localizedDescription)
            }
            self?.transactionRequest = nil
        }
    }
    
    func rejectTransaction() {
        guard let transactionRequest else {
            return
        }
        
        Task { [weak self] in
            do {
                try await transactionRequest.reject(reason: "Test transaction rejection reason")
            } catch {
                debugPrint(error.localizedDescription)
            }
            self?.transactionRequest = nil
        }
    }
    
    func approveSignData() {
        guard let signDataRequest else {
            return
        }
        
        Task { [weak self] in
            do {
                try await signDataRequest.approve()
            } catch {
                debugPrint(error.localizedDescription)
            }
            self?.signDataRequest = nil
        }
    }
    
    func rejectSignData() {
        guard let signDataRequest else {
            return
        }
        
        Task { [weak self] in
            do {
                try await signDataRequest.reject(reason: "Test transaction rejection reason")
            } catch {
                debugPrint(error.localizedDescription)
            }
            self?.signDataRequest = nil
        }
    }
}

extension WalletDAppConnectionViewModel {
    
    enum Approval {
        case connection
        case transaction
        case signData
    }
}
