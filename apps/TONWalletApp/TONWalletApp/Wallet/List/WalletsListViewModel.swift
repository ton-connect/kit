//
//  WalletsListViewModel.swift
//  TONWalletApp
//
//  Created by Nikita Rodionov on 09.10.2025.
//

import Foundation
import Combine
import TONWalletKit

@MainActor
class WalletsListViewModel: ObservableObject {
    @Published private(set) var wallets: [WalletViewModel] = []
    
    var onRemoveAll: (() -> Void)?
    
    private var subscribers = Set<AnyCancellable>()
    
    @Published var alertPresented = false
    
    var approval: Approval? {
        didSet {
            alertPresented = approval != nil
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
    
    init(wallets: [WalletViewModel]) {
        self.wallets = wallets
    }
    
    func add(wallets: [TONWallet]) {
        let viewModels = wallets.map { WalletViewModel(tonWallet: $0) }
        add(wallets: viewModels)
    }
    
    func add(wallets: [WalletViewModel]) {
        self.wallets.append(contentsOf: wallets)
        
        wallets.forEach { wallet in
            let id = wallet.id
            
            wallet.onRemove = { [weak self] in
                self?.remove(walletID: id)
                
                if self?.wallets.isEmpty == true {
                    self?.onRemoveAll?()
                }
            }
        }
    }
    
    func waitForEvents() {
        subscribers.removeAll()
        
        TONEventsHandler.shared.events
            .receive(on: DispatchQueue.main)
            .sink { [weak self] event in
                switch event {
                case .transactionRequest(let request):
                    self?.transactionRequest = request
                case .signDataRequest(let request):
                    self?.signDataRequest = request
                default: ()
                }
            }
            .store(in: &subscribers)
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
    
    private func remove(walletID: WalletViewModel.ID) {
        self.wallets.removeAll { $0.id == walletID }
    }
}

extension WalletsListViewModel {
    
    enum Approval {
        case transaction
        case signData
    }
}
