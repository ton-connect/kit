//  TONLimitRequest.swift
//  TONWalletKit
//
//  Created by AI on 14.10.2025.
//

import Foundation

public struct TONLimitRequest: Codable {
    public var limit: Int?
    public var offset: Int?
    
    public init(
        limit: Int? = nil,
        offset: Int? = nil
    ) {
        self.limit = limit
        self.offset = offset
    }
}
