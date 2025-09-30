//
//  ConnectRequestEvent.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 11.09.2025.
//

import Foundation

public struct ConnectRequestEvent: Codable {
    public let preview: Preview?
}

public struct ConnectPermission: Codable {
    public let name: String?
    public let title: String?
    public let description: String?
}

public extension ConnectRequestEvent {
    
    struct Preview: Codable {
        public let appName: String?
        public let appDescription: String?
        public let appIconURL: URL?
        public let appURL: URL?
        
        enum CodingKeys: String, CodingKey {
            case appName = "manifest.name"
            case appDescription = "manifest.description"
            case appIconURL = "manifest.iconUrl"
            case appURL = "manifest.url"
        }
    }
}
