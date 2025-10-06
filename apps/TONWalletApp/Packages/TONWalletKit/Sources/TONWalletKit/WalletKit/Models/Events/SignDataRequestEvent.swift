//
//  SignDataRequestEvent.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 11.09.2025.
//

import Foundation

public struct SignDataRequestEvent: Codable {
    let id: String?
    let from: String?
    let walletAddress: String?
    let domain: String?
    let sessionId: String?
    let messageId: String?
    
    let request: Payload?
    let dAppInfo: DAppInfo?
    let preview: Preview?
}

extension SignDataRequestEvent {
    
    struct Payload: Codable {
        let network: TONNetwork?
        let from: String?
        let type: SignDataType
        let bytes: String?
        let schema: String?
        let cell: String?
        let text: String?
    }
    
    struct Preview: Codable {
        let type: SignDataType
        let content: String?
        let schema: String?
        
        enum CodingKeys: String, CodingKey {
            case type = "kind"
            case content
            case schema
        }
    }
}

public enum SignDataType: String, Codable {
    case text
    case binary
    case cell
}
