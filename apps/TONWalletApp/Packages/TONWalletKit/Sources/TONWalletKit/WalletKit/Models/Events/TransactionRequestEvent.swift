//
//  TransactionRequestEvent.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 11.09.2025.
//

import Foundation

public struct TransactionRequestEvent: Codable {
    public let id: String
    public let walletAddress: String
    public let dAppName: String
    public let preview: TransactionPreview
    public let messages: [TransactionMessage]
    public let validUntil: TimeInterval
    
    public init(
        id: String,
        walletAddress: String,
        dAppName: String,
        preview: TransactionPreview,
        messages: [TransactionMessage],
        validUntil: TimeInterval
    ) {
        self.id = id
        self.walletAddress = walletAddress
        self.dAppName = dAppName
        self.preview = preview
        self.messages = messages
        self.validUntil = validUntil
    }
}

public struct TransactionPreview: Codable {
    public let totalAmount: String
    public let totalFees: String?
    public let recipient: String?
    public let description: String?
    public let riskLevel: RiskLevel
    
    public init(
        totalAmount: String,
        totalFees: String? = nil,
        recipient: String? = nil,
        description: String? = nil,
        riskLevel: RiskLevel = .low
    ) {
        self.totalAmount = totalAmount
        self.totalFees = totalFees
        self.recipient = recipient
        self.description = description
        self.riskLevel = riskLevel
    }
}

public struct TransactionMessage: Codable, Identifiable {
    public let id: String
    public let to: String
    public let amount: String
    public let payload: String?
    public let stateInit: String?
    
    public init(
        id: String? = nil,
        to: String,
        amount: String,
        payload: String? = nil,
        stateInit: String? = nil
    ) {
        self.id = id ?? UUID().uuidString
        self.to = to
        self.amount = amount
        self.payload = payload
        self.stateInit = stateInit
    }
}

public enum RiskLevel: String, Codable {
    case low
    case medium
    case high
    case critical
}
