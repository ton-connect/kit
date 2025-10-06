//
//  ConnectRequestEvent.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 11.09.2025.
//

import Foundation

public struct ConnectRequestEvent: Codable {
    private let id: String
    private let from: String
    
    let preview: Preview?
    let request: [Request]?
    let dAppInfo: DAppInfo?
    
    var walletAddress: String?
}

public extension ConnectRequestEvent {
    
    struct Preview: Codable {
        public let manifestURL: URL?
        public let manifest: Manifest?
        public let permissions: [ConnectPermission]
        
        let requestedItems: [ConnectRequestEvent.Request]
    }
}

public extension ConnectRequestEvent.Preview {
    
    struct Manifest: Codable {
        let name: String?
        let description: String?
        let url: String?
        let iconUrl: String?
    }
    
    struct ConnectPermission: Codable {
        public let name: String?
        public let title: String?
        public let description: String?
    }
}

extension ConnectRequestEvent {
    
    struct Request: Codable {
        let name: String?
        let payload: String?
    }
}
