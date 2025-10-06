//
//  DisconnectEvent.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 11.09.2025.
//

import Foundation

public struct DisconnectEvent: Codable {
    public let id: String?
    public let from: String?
    public let walletAddress: String?
    public let domain: String?
    public let sessionId: String?
    public let messageId: String?
    public let reason: String?
    
    public let dAppInfo: DAppInfo?
}
