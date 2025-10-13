//  TONTransactionPreview.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 13.10.2025.
//

import Foundation

public enum TONTransactionPreview: Codable {
    case error(TONTransactionPreviewEmulationError)
    case success(TONTransactionPreviewEmulationResult)
    
    private enum CodingKeys: String, CodingKey {
        case result
        case emulationError
        case moneyFlow
        case emulationResult
    }
    
    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let result = try container.decode(String.self, forKey: .result)
        switch result {
        case "error":
            let error = try TONTransactionPreviewEmulationError(from: decoder)
            self = .error(error)
        case "success":
            let success = try TONTransactionPreviewEmulationResult(from: decoder)
            self = .success(success)
        default:
            throw DecodingError.dataCorruptedError(forKey: .result, in: container, debugDescription: "Unknown transaction result type")
        }
    }
    
    public func encode(to encoder: Encoder) throws {
        switch self {
        case .error(let error):
            try error.encode(to: encoder)
        case .success(let result):
            try result.encode(to: encoder)
        }
    }
}

public struct TONTransactionPreviewEmulationError: Codable {
    public let result: String = "error"
    public let emulationError: TONEmulationError
}

public struct TONTransactionPreviewEmulationResult: Codable {
    public let result: String = "success"
    public let moneyFlow: TONMoneyFlow
    public let emulationResult: TONToncenterEmulationResponse
}
