//
//  TONWallet.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 12.09.2025.
//

import Foundation

public class TONWallet {
    let wallet: any JSDynamicObject
    
    init(wallet: any JSDynamicObject) {
        self.wallet = wallet
    }
    
    public static func add(data: TONWalletData) async throws -> TONWallet {
        let encoder = JSONEncoder()
        let data = try encoder.encode(data)
        
        guard let configString = String(data: data, encoding: .utf8) else {
            throw "Unable to decode \(TONWalletData.self)"
        }
        
        TONWalletKit.addWallet(configString)
        
        guard let wallet = await TONWalletKit.getWallets()?.then().atIndex(0) else {
            throw "No wallet was added"
        }
        
        return TONWallet(wallet: wallet)
    }
    
    public func address() async throws -> String? {
        guard let value = wallet.getAddress() else {
            return nil
        }
        return value.toString()
    }
    
    public func balance() async throws -> Int? {
        guard let value = await wallet.getBalance()?.catchPromise() else {
            return nil
        }
        
        return nil
    }
}
