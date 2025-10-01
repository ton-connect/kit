//
//  ConnectRequestEvent.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 11.09.2025.
//

import Foundation

public struct ConnectRequestEvent: Decodable {
    private(set) var base: BaseBridgeEvent?
    
    public let preview: Preview?
    
    var walletAddress: String? {
        get { base?.walletAddress }
        set { base?.walletAddress = newValue }
    }
    
    enum CodingKeys: CodingKey {
        case preview
    }
    
    public init(from decoder: any Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        self.base = try decoder.singleValueContainer().decode(BaseBridgeEvent.self)
        self.preview = try container.decodeIfPresent(ConnectRequestEvent.Preview.self, forKey: .preview)
    }
}

public extension ConnectRequestEvent {
    
    struct Preview: Decodable {
        public let manifest: Manifest?
        public let permissions: [ConnectPermission]
    }
}

public extension ConnectRequestEvent.Preview {
    
    struct Manifest: Decodable {
        public let appName: String?
        public let appDescription: String?
        public let appIconURL: URL?
        public let appURL: URL?
        public let manifestURL: URL?
        
        enum CodingKeys: String, CodingKey {
            case appName = "dAppName"
            case appDescription = "description"
            case appIconURL = "iconUrl"
            case appURL = "dAppUrl"
            case manifestURL = "manifestUrl"
        }
    }
    
    struct ConnectPermission: Decodable {
        public let name: String?
        public let title: String?
        public let description: String?
    }
}
