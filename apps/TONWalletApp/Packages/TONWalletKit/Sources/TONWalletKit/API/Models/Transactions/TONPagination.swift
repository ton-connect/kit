//  TONPagination.swift
//  TONWalletKit
//
//  Created by AI on 14.10.2025.
//

import Foundation

public struct TONPagination: Codable {
    public var offset: Int
    public var limit: Int
    public var pages: Int?
    
    public init(offset: Int, limit: Int, pages: Int? = nil) {
        self.offset = offset
        self.limit = limit
        self.pages = pages
    }
}
