//  TONNftCollection.swift
//  TONWalletKit
//
//  Created by AI on 14.10.2025.
//

import Foundation

public struct TONNftCollection: Codable {
    public var address: String
    public var codeHash: String?
    public var dataHash: String?
    public var lastTransactionLt: String?
    public var nextItemIndex: String
    public var ownerAddress: String?
}
