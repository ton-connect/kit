//  TONNftItem.swift
//  TONWalletKit
//
//  Created by AI on 14.10.2025.
//

import Foundation

public struct TONNftItem: Codable {
    public var address: String
    public var auctionContractAddress: String?
    public var codeHash: String?
    public var dataHash: String?
    public var collection: TONNftCollection?
    public var collectionAddress: String?
    public var metadata: TONTokenInfo?
    public var index: String
    public var initFlag: Bool
    public var lastTransactionLt: String?
    public var onSale: Bool
    public var ownerAddress: String?
    public var realOwner: String?
    public var saleContractAddress: String?
}
