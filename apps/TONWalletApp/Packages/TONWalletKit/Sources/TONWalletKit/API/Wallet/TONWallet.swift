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
        let encoder = JSONEncoder()
        let data = try encoder.encode(data)
        
        guard let configString = String(data: data, encoding: .utf8) else {
            throw "Unable to decode \(TONWalletData.self)"
        }
        
        TONWalletKit.addWallet(configString)
        
        guard let wallet = await TONWalletKit.getWallets()?.then().atIndex(0) else {
            throw "No wallet was added"
        }
        
        let address = await wallet.getAddress()?.toString()
        
        return TONWallet(wallet: wallet, address: address)
    }
    
    public func balance() async throws -> String? {
        await wallet.getBalance()?.then().toString()
    }
}
