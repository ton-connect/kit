//
//  WalletKitConfig.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 11.09.2025.
//
import Foundation

public struct WalletKitConfig {
    public let apiKey: String?
    public let network: TONNetwork
    public let storage: StorageConfig
    public let bridgeUrl: String
    
    public init(
        apiKey: String? = nil,
        network: TONNetwork = .mainnet,
        storage: StorageConfig = .local,
        bridgeUrl: String
    ) {
        self.apiKey = apiKey
        self.network = network
        self.storage = storage
        self.bridgeUrl = bridgeUrl
    }
}

public enum StorageConfig {
    case local
    case memory
    case custom(String) // Custom storage identifier
}

public enum TONNetwork: String, CaseIterable, Codable {
    case mainnet = "-239"
    case testnet = "-3"
    
    public var chainId: String { rawValue }
}
