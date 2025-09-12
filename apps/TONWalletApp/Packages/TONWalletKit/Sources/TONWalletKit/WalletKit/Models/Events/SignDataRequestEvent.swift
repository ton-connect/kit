//
//  SignDataRequestEvent.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 11.09.2025.
//

import Foundation

public struct SignDataRequestEvent: Codable, Identifiable {
    public let id: String
    public let walletAddress: String
    public let dAppName: String
    public let data: SignDataPayload
    public let preview: SignDataPreview
    
    public init(
        id: String,
        walletAddress: String,
        dAppName: String,
        data: SignDataPayload,
        preview: SignDataPreview
    ) {
        self.id = id
        self.walletAddress = walletAddress
        self.dAppName = dAppName
        self.data = data
        self.preview = preview
    }
}

public struct SignDataPayload: Codable {
    public let message: String
    public let domain: String?
    public let timestamp: TimeInterval
    
    public init(message: String, domain: String? = nil, timestamp: TimeInterval = Date().timeIntervalSince1970) {
        self.message = message
        self.domain = domain
        self.timestamp = timestamp
    }
}

public struct SignDataPreview: Codable {
    public let type: SignDataType
    public let content: String
    public let schema: String?
    public let parsed: [String: AnyCodable]?
    
    public init(
        type: SignDataType,
        content: String,
        schema: String? = nil,
        parsed: [String: AnyCodable]? = nil
    ) {
        self.type = type
        self.content = content
        self.schema = schema
        self.parsed = parsed
    }
}

public enum SignDataType: String, Codable {
    case text
    case binary
    case cell
}
