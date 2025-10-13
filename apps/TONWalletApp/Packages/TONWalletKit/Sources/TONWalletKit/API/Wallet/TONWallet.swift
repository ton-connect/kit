//
//  TONWallet.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 12.09.2025.
//

import Foundation

public class TONWallet {
    public let address: String?
    
    let wallet: any JSDynamicObject
    
    init(wallet: any JSDynamicObject, address: String?) {
        self.wallet = wallet
        self.address = address
    }
    
    public static func add(data: TONWalletData) async throws -> TONWallet {
        guard let wallet = try await TONWalletKit.addWallet(data) else {
            throw "No wallet added"
        }
        
        let address = try await wallet.getAddress()?.toString()
        
        return TONWallet(wallet: wallet, address: address)
    }
    
    public func balance() async throws -> String? {
        try await wallet.getBalance()?.toString()
    }
    
    public func sateInit() async throws -> String? {
        try await wallet.getSateInit()?.toString()
    }
    
    public func connect(url: String) async throws {
        try await TONWalletKit.handleTonConnectUrl(url)
    }
    
    public func remove() async throws {
        if let address {
            try await TONWalletKit.removeWallet(address)
        }
    }
}
