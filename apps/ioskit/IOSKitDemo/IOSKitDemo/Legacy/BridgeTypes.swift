//
//  BridgeTypes.swift
//  IOSKitDemo
//
//  Supporting types for TonConnect Bridge
//

import Foundation

// MARK: - Bridge Request/Response Types

struct BridgeRequest {
    let method: String
    let args: [Any]
    let requestId: String
}

struct BridgeResponse {
    let requestId: String
    let success: Bool
    let result: Any?
    let error: String?
}

// MARK: - TonConnect Types

struct LegacyWalletInfo: Codable {
    let address: String
    let chain: Int
    let walletName: String
    let publicKey: String?
    
    enum CodingKeys: String, CodingKey {
        case address
        case chain
        case walletName = "wallet_name"
        case publicKey = "public_key"
    }
}

struct TransactionRequest: Codable {
    let to: String
    let amount: String
    let memo: String?
}

struct LegacyTransactionResult: Codable {
    let hash: String
    let timestamp: Double
    let transaction: TransactionRequest
}

struct SignDataRequest: Codable {
    let message: String
    let timestamp: Double
    let domain: String?
}

struct LegacySignDataResult: Codable {
    let signature: String
    let timestamp: Double
    let data: SignDataRequest
}

// MARK: - Bridge Errors

enum BridgeError: Error, LocalizedError {
    case invalidRequest
    case methodNotFound(String)
    case invalidArguments
    case walletNotConnected
    case transactionFailed(String)
    case signingFailed(String)
    case networkError(String)
    
    var errorDescription: String? {
        switch self {
        case .invalidRequest:
            return "Invalid bridge request"
        case .methodNotFound(let method):
            return "Method not found: \(method)"
        case .invalidArguments:
            return "Invalid arguments provided"
        case .walletNotConnected:
            return "Wallet is not connected"
        case .transactionFailed(let reason):
            return "Transaction failed: \(reason)"
        case .signingFailed(let reason):
            return "Signing failed: \(reason)"
        case .networkError(let reason):
            return "Network error: \(reason)"
        }
    }
}

