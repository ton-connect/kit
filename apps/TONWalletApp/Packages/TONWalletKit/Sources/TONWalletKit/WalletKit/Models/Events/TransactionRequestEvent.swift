//
//  TransactionRequestEvent.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 11.09.2025.
//

import Foundation

public struct TransactionRequestEvent: Codable {
    let id: String?
    let from: String?
    let walletAddress: String?
    let domain: String?
    let sessionId: String?
    let messageId: String?
    
    let request: Request?
    let dAppInfo: DAppInfo?
    let error: String?
}

extension TransactionRequestEvent {
    
    struct Request: Codable {
        let messages: [Message]?
        
        let network: TONNetwork?
        let validUntil: TimeInterval?
        let from: String?
        
        enum CodingKeys: String, CodingKey {
            case messages
            case network
            case validUntil = "valid_until"
            case from
        }
    }
}

extension TransactionRequestEvent.Request {
    
    struct Message: Codable {
        let address: String?
        let amount: String?
        let payload: String?
        let stateInit: String? // boc
        let mode: Int?
    }
}
