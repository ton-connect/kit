//
//  ConnectRequestEvent.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 11.09.2025.
//

import Foundation

public struct ConnectRequestEvent: Codable {
    public let id: String
    public let dAppName: String
    public let dAppUrl: String
    public let dAppIconUrl: String?
    public let manifestUrl: String
    public let requestedItems: [String]
    public let permissions: [ConnectPermission]
    
    public init(
        id: String,
        dAppName: String,
        dAppUrl: String,
        dAppIconUrl: String? = nil,
        manifestUrl: String,
        requestedItems: [String],
        permissions: [ConnectPermission]
    ) {
        self.id = id
        self.dAppName = dAppName
        self.dAppUrl = dAppUrl
        self.dAppIconUrl = dAppIconUrl
        self.manifestUrl = manifestUrl
        self.requestedItems = requestedItems
        self.permissions = permissions
    }
}

public struct ConnectPermission: Codable {
    public let id: String
    public let name: String
    public let title: String
    public let description: String
    
    public init(name: String, title: String, description: String) {
        self.id = name
        self.name = name
        self.title = title
        self.description = description
    }
}
