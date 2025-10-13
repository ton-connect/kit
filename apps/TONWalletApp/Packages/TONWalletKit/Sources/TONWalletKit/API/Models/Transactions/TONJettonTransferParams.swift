//  TONJettonTransferParams.swift
//  TONWalletKit
//
//  Created by AI on 13.10.2025.
//

import Foundation

public struct TONJettonTransferParams: Codable {
    public var toAddress: String
    public var jettonAddress: String
    public var amount: String
    public var comment: String?
    
    public init(
        toAddress: String,
        jettonAddress: String,
        amount: String,
        comment: String? = nil
    ) {
        self.toAddress = toAddress
        self.jettonAddress = jettonAddress
        self.amount = amount
        self.comment = comment
    }
}
