//
//  TONWalletData.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 12.09.2025.
//

import Foundation

public struct TONWalletData: Codable {
    public let mnemonic: [String]
    public let name: String
    public let network: TONNetwork
    public let version: String
    
    public init(
        mnemonic: TONMnemonic,
        name: String,
        network: TONNetwork = .mainnet,
        version: String = "v5r1"
    ) {
        self.mnemonic = mnemonic.value
        self.name = name
        self.network = network
        self.version = version
    }
}
