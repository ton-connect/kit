//  TONEmulationError.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 13.10.2025.
//

import Foundation

public struct TONEmulationError: Codable {
    // Define fields as needed
    public var code: Int?
    public var message: String?
    public var details: [String: String]?
    
    public init(code: Int? = nil, message: String? = nil, details: [String: String]? = nil) {
        self.code = code
        self.message = message
        self.details = details
    }
}
