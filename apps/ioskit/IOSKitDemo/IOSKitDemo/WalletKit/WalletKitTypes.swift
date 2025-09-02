//
//  WalletKitTypes.swift
//  TonWalletKit Swift Types
//
//  Swift type definitions for WalletKit
//

import Foundation

// MARK: - Wallet Types

public struct WalletInfo: Codable, Identifiable, Equatable {
    public let id: String
    public let address: String
    public let publicKey: String?
    public let walletName: String
    public let network: TonNetwork
    public let version: String
    public let balance: String?
    
    public init(
        id: String? = nil,
        address: String,
        publicKey: String? = nil,
        walletName: String,
        network: TonNetwork,
        version: String,
        balance: String? = nil
    ) {
        self.id = id ?? address
        self.address = address
        self.publicKey = publicKey
        self.walletName = walletName
        self.network = network
        self.version = version
        self.balance = balance
    }
}

public struct WalletConfig: Codable {
    public let mnemonic: [String]
    public let name: String
    public let network: TonNetwork
    public let version: String
    
    public init(mnemonic: [String], name: String, network: TonNetwork = .mainnet, version: String = "v5r1") {
        self.mnemonic = mnemonic
        self.name = name
        self.network = network
        self.version = version
    }
}

// MARK: - Session Types

public struct SessionInfo: Codable, Identifiable, Equatable {
    public let id: String
    public let sessionId: String
    public let dAppName: String
    public let walletAddress: String
    public let dAppUrl: String?
    public let dAppIconUrl: String?
    public let createdAt: Date
    public let lastActivity: Date
    
    public init(
        sessionId: String,
        dAppName: String,
        walletAddress: String,
        dAppUrl: String? = nil,
        dAppIconUrl: String? = nil,
        createdAt: Date = Date(),
        lastActivity: Date = Date()
    ) {
        self.id = sessionId
        self.sessionId = sessionId
        self.dAppName = dAppName
        self.walletAddress = walletAddress
        self.dAppUrl = dAppUrl
        self.dAppIconUrl = dAppIconUrl
        self.createdAt = createdAt
        self.lastActivity = lastActivity
    }
}

// MARK: - Event Types

public struct ConnectRequestEvent: Codable, Identifiable {
    public let id: String
    public let dAppName: String
    public let dAppUrl: String
    public let dAppIconUrl: String?
    public let manifestUrl: String
    public let requestedItems: [String]
    public let permissions: [ConnectPermission]
    
    public init(
        id: String,
        dAppName: String,
        dAppUrl: String,
        dAppIconUrl: String? = nil,
        manifestUrl: String,
        requestedItems: [String],
        permissions: [ConnectPermission]
    ) {
        self.id = id
        self.dAppName = dAppName
        self.dAppUrl = dAppUrl
        self.dAppIconUrl = dAppIconUrl
        self.manifestUrl = manifestUrl
        self.requestedItems = requestedItems
        self.permissions = permissions
    }
}

public struct ConnectPermission: Codable, Identifiable {
    public let id: String
    public let name: String
    public let title: String
    public let description: String
    
    public init(name: String, title: String, description: String) {
        self.id = name
        self.name = name
        self.title = title
        self.description = description
    }
}

public struct TransactionRequestEvent: Codable, Identifiable {
    public let id: String
    public let walletAddress: String
    public let dAppName: String
    public let preview: TransactionPreview
    public let messages: [TransactionMessage]
    public let validUntil: TimeInterval
    
    public init(
        id: String,
        walletAddress: String,
        dAppName: String,
        preview: TransactionPreview,
        messages: [TransactionMessage],
        validUntil: TimeInterval
    ) {
        self.id = id
        self.walletAddress = walletAddress
        self.dAppName = dAppName
        self.preview = preview
        self.messages = messages
        self.validUntil = validUntil
    }
}

public struct TransactionPreview: Codable {
    public let totalAmount: String
    public let totalFees: String?
    public let recipient: String?
    public let description: String?
    public let riskLevel: RiskLevel
    
    public init(
        totalAmount: String,
        totalFees: String? = nil,
        recipient: String? = nil,
        description: String? = nil,
        riskLevel: RiskLevel = .low
    ) {
        self.totalAmount = totalAmount
        self.totalFees = totalFees
        self.recipient = recipient
        self.description = description
        self.riskLevel = riskLevel
    }
}

public struct TransactionMessage: Codable, Identifiable {
    public let id: String
    public let to: String
    public let amount: String
    public let payload: String?
    public let stateInit: String?
    
    public init(
        id: String? = nil,
        to: String,
        amount: String,
        payload: String? = nil,
        stateInit: String? = nil
    ) {
        self.id = id ?? UUID().uuidString
        self.to = to
        self.amount = amount
        self.payload = payload
        self.stateInit = stateInit
    }
}

public enum RiskLevel: String, Codable, CaseIterable {
    case low = "low"
    case medium = "medium"
    case high = "high"
    case critical = "critical"
}

public struct SignDataRequestEvent: Codable, Identifiable {
    public let id: String
    public let walletAddress: String
    public let dAppName: String
    public let data: SignDataPayload
    public let preview: SignDataPreview
    
    public init(
        id: String,
        walletAddress: String,
        dAppName: String,
        data: SignDataPayload,
        preview: SignDataPreview
    ) {
        self.id = id
        self.walletAddress = walletAddress
        self.dAppName = dAppName
        self.data = data
        self.preview = preview
    }
}

public struct SignDataPayload: Codable {
    public let message: String
    public let domain: String?
    public let timestamp: TimeInterval
    
    public init(message: String, domain: String? = nil, timestamp: TimeInterval = Date().timeIntervalSince1970) {
        self.message = message
        self.domain = domain
        self.timestamp = timestamp
    }
}

public struct SignDataPreview: Codable {
    public let type: SignDataType
    public let content: String
    public let schema: String?
    public let parsed: [String: AnyCodable]?
    
    public init(
        type: SignDataType,
        content: String,
        schema: String? = nil,
        parsed: [String: AnyCodable]? = nil
    ) {
        self.type = type
        self.content = content
        self.schema = schema
        self.parsed = parsed
    }
}

public enum SignDataType: String, Codable, CaseIterable {
    case text = "text"
    case binary = "binary"
    case cell = "cell"
}

public struct DisconnectEvent: Codable, Identifiable {
    public let id: String
    public let sessionId: String
    public let walletAddress: String
    public let reason: String?
    
    public init(sessionId: String, walletAddress: String, reason: String? = nil) {
        self.id = sessionId
        self.sessionId = sessionId
        self.walletAddress = walletAddress
        self.reason = reason
    }
}

// MARK: - Result Types

public struct TransactionResult: Codable {
    public let hash: String
    public let timestamp: TimeInterval
    public let signedBoc: String
    
    public init(hash: String, timestamp: TimeInterval = Date().timeIntervalSince1970, signedBoc: String) {
        self.hash = hash
        self.timestamp = timestamp
        self.signedBoc = signedBoc
    }
}

public struct SignDataResult: Codable {
    public let signature: String
    public let timestamp: TimeInterval
    
    public init(signature: String, timestamp: TimeInterval = Date().timeIntervalSince1970) {
        self.signature = signature
        self.timestamp = timestamp
    }
}

// MARK: - Jetton Types

public struct JettonInfo: Codable, Identifiable {
    public let id: String
    public let address: String
    public let name: String
    public let symbol: String
    public let decimals: Int
    public let balance: String
    public let imageUrl: String?
    public let verified: Bool
    
    public init(
        address: String,
        name: String,
        symbol: String,
        decimals: Int,
        balance: String,
        imageUrl: String? = nil,
        verified: Bool = false
    ) {
        self.id = address
        self.address = address
        self.name = name
        self.symbol = symbol
        self.decimals = decimals
        self.balance = balance
        self.imageUrl = imageUrl
        self.verified = verified
    }
}

// MARK: - Internal Event Types

enum WalletKitEvent {
    case connectRequest(ConnectRequestEvent)
    case transactionRequest(TransactionRequestEvent)
    case signDataRequest(SignDataRequestEvent)
    case disconnect(DisconnectEvent)
    case stateChanged
}

// MARK: - Helper Types

// Generic codable wrapper for unknown JSON values
public struct AnyCodable: Codable {
    public let value: Any
    
    public init(_ value: Any) {
        self.value = value
    }
    
    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        
        if let intValue = try? container.decode(Int.self) {
            value = intValue
        } else if let doubleValue = try? container.decode(Double.self) {
            value = doubleValue
        } else if let stringValue = try? container.decode(String.self) {
            value = stringValue
        } else if let boolValue = try? container.decode(Bool.self) {
            value = boolValue
        } else if let arrayValue = try? container.decode([AnyCodable].self) {
            value = arrayValue.map { $0.value }
        } else if let dictValue = try? container.decode([String: AnyCodable].self) {
            value = dictValue.mapValues { $0.value }
        } else {
            value = NSNull()
        }
    }
    
    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        
        switch value {
        case let intValue as Int:
            try container.encode(intValue)
        case let doubleValue as Double:
            try container.encode(doubleValue)
        case let stringValue as String:
            try container.encode(stringValue)
        case let boolValue as Bool:
            try container.encode(boolValue)
        case let arrayValue as [Any]:
            let codableArray = arrayValue.map(AnyCodable.init)
            try container.encode(codableArray)
        case let dictValue as [String: Any]:
            let codableDict = dictValue.mapValues(AnyCodable.init)
            try container.encode(codableDict)
        default:
            try container.encodeNil()
        }
    }
}
