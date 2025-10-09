//
//  WalletsStorage.swift
//  TONWalletApp
//
//  Created by Nikita Rodionov on 06.10.2025.
//

import Foundation

class WalletsStorage {
    private var keychain = Keychain<[WalletEntity]>(key: "com.walletkit.demoapp.keychain.wallets")
    
    public func wallets() throws -> [WalletEntity] {
        let wallets = try keychain.load()
        return wallets ?? []
    }
    
    public func add(wallet: WalletEntity) throws {
        var wallets = try self.wallets()
        wallets.append(wallet)
        try keychain.save(wallets)
    }
    
    func remove(walletAddress: String?) throws {
        var wallets = try self.wallets()
        wallets.removeAll { $0.address == walletAddress }
        try keychain.save(wallets)
    }
    
    public func removeAllWallets() throws {
        try keychain.clear()
    }
}
