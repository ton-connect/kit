//  TONMoneyFlow.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 13.10.2025.
//

import Foundation

public struct TONMoneyFlowRow: Codable {
    public var type: TONAssetType
    public var jetton: String?
    public var from: String
    public var to: String
    public var amount: String
    
    public init(
        type: TONAssetType,
        jetton: String? = nil,
        from: String,
        to: String,
        amount: String
    ) {
        self.type = type
        self.jetton = jetton
        self.from = from
        self.to = to
        self.amount = amount
    }
}

public struct TONMoneyFlowSelf: Codable {
    public var type: TONAssetType
    public var jetton: String?
    public var amount: String
    
    public init(
        type: TONAssetType,
        jetton: String? = nil,
        amount: String
    ) {
        self.type = type
        self.jetton = jetton
        self.amount = amount
    }
}

public struct TONMoneyFlow: Codable {
    public var outputs: String
    public var inputs: String
    public var allJettonTransfers: [TONMoneyFlowRow]
    public var ourTransfers: [TONMoneyFlowSelf]
    public var ourAddress: String?

    public init(
        outputs: String,
        inputs: String,
        allJettonTransfers: [TONMoneyFlowRow],
        ourTransfers: [TONMoneyFlowSelf],
        ourAddress: String?
    ) {
        self.outputs = outputs
        self.inputs = inputs
        self.allJettonTransfers = allJettonTransfers
        self.ourTransfers = ourTransfers
        self.ourAddress = ourAddress
    }
}
