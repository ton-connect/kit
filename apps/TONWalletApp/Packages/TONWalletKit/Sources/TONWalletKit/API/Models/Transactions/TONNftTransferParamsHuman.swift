//  TONNftTransferParamsHuman.swift
//  TONWalletKit
//
//  Created by AI on 14.10.2025.
//

import Foundation

public struct TONNftTransferParamsHuman: Codable {
    public var nftAddress: String
    public var transferAmount: String
    public var toAddress: String
    public var comment: String?
    
    public init(nftAddress: String, transferAmount: String, toAddress: String, comment: String? = nil) {
        self.nftAddress = nftAddress
        self.transferAmount = transferAmount
        self.toAddress = toAddress
        self.comment = comment
    }
}
