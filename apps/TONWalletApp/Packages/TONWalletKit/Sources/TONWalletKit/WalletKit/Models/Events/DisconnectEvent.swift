//
//  DisconnectEvent.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 11.09.2025.
//

import Foundation

public struct DisconnectEvent: Codable, Identifiable {
    public let id: String
    public let sessionId: String
    public let walletAddress: String
    public let reason: String?
    
    public init(sessionId: String, walletAddress: String, reason: String? = nil) {
        self.id = sessionId
        self.sessionId = sessionId
        self.walletAddress = walletAddress
        self.reason = reason
    }
}
