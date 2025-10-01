//
//  BaseBridgeEvent.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 01.10.2025.
//

import Foundation

struct BaseBridgeEvent: Codable {
    let id: String?
    let from: String?
    let domain: String?
    let isJsBridge: Bool?
    let sessionId: String?
    let isLocal: Bool?
    let messageId: String?
    let traceId: String?
    
    var walletAddress: String?
}
