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
    
    var walletAddress: String?
}

public extension ConnectRequestEvent {
    
    struct Preview: Codable {
        public let manifest: Manifest?
        public let permissions: [ConnectPermission]
    }
}

public extension ConnectRequestEvent.Preview {
    
    struct Manifest: Codable {
        public let appName: String?
        public let appDescription: String?
        public let appIconURL: URL?
        public let appURL: URL?
        public let manifestURL: URL?
        public let url: URL?
        
        enum CodingKeys: String, CodingKey {
            case appName = "dAppName"
            case appDescription = "description"
            case appIconURL = "iconUrl"
            case appURL = "dAppUrl"
            case manifestURL = "manifestUrl"
            case url
        }
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
