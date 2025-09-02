//
//  WalletKitSwift.swift
//  TonWalletKit Swift Wrapper
//
//  A standalone Swift library wrapper for TonWalletKit
//

import Foundation
import Combine

// MARK: - Main WalletKit Interface

/// Main TonWalletKit Swift interface
@MainActor
public class TonWalletKitSwift: ObservableObject {
    
    // MARK: - Published Properties
    @Published public private(set) var isInitialized: Bool = false
    @Published public private(set) var wallets: [WalletInfo] = []
    @Published public private(set) var sessions: [SessionInfo] = []
    
    // MARK: - Private Properties  
    private let walletKitEngine: WalletKitEngine?
    private let nativeEngine: WalletKitNativeEngine?
    private let useNativeEngine: Bool
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Event Handlers
    public var onConnectRequest: ((ConnectRequestEvent) -> Void)?
    public var onTransactionRequest: ((TransactionRequestEvent) -> Void)?
    public var onSignDataRequest: ((SignDataRequestEvent) -> Void)?
    public var onDisconnect: ((DisconnectEvent) -> Void)?
    
    // MARK: - Initialization
    
    public init(config: WalletKitConfig, useNativeEngine: Bool = false) {
        self.useNativeEngine = useNativeEngine
        
        if useNativeEngine {
            self.nativeEngine = WalletKitNativeEngine(config: config)
            self.walletKitEngine = nil
        } else {
            self.walletKitEngine = WalletKitEngine(config: config)
            self.nativeEngine = nil
        }
        
        setupEventHandlers()
    }
    
    /// Initialize the WalletKit system
    public func initialize() async throws {
        do {
            if useNativeEngine {
                try await nativeEngine?.initialize()
            } else {
                try await walletKitEngine?.initialize()
            }
            await refreshState()
            isInitialized = true
        } catch {
            throw WalletKitError.initializationFailed(error.localizedDescription)
        }
    }
    
    private func setupEventHandlers() {
        if useNativeEngine {
            nativeEngine?.eventPublisher
                .receive(on: DispatchQueue.main)
                .sink { [weak self] event in
                    self?.handleWalletKitEvent(event)
                }
                .store(in: &cancellables)
        } else {
            walletKitEngine?.eventPublisher
                .receive(on: DispatchQueue.main)
                .sink { [weak self] event in
                    self?.handleWalletKitEvent(event)
                }
                .store(in: &cancellables)
        }
    }
    
    private func handleWalletKitEvent(_ event: WalletKitEvent) {
        switch event {
        case .connectRequest(let connectEvent):
            onConnectRequest?(connectEvent)
        case .transactionRequest(let txEvent):
            onTransactionRequest?(txEvent)
        case .signDataRequest(let signEvent):
            onSignDataRequest?(signEvent)
        case .disconnect(let disconnectEvent):
            onDisconnect?(disconnectEvent)
        case .stateChanged:
            Task { await refreshState() }
        }
    }
    
    // MARK: - Wallet Management
    
    /// Get all registered wallets
    public func getWallets() -> [WalletInfo] {
        return wallets
    }
    
    /// Get wallet by address
    public func getWallet(address: String) -> WalletInfo? {
        return wallets.first { $0.address == address }
    }
    
    /// Add a new wallet
    public func addWallet(_ config: WalletConfig) async throws {
        do {
            if useNativeEngine {
                try await nativeEngine?.addWallet(config)
            } else {
                try await walletKitEngine?.addWallet(config)
            }
            await refreshState()
        } catch {
            throw WalletKitError.walletOperationFailed(error.localizedDescription)
        }
    }
    
    /// Remove a wallet
    public func removeWallet(_ wallet: WalletInfo) async throws {
        do {
            if useNativeEngine {
                // Native engine removeWallet would need to be implemented
                print("⚠️ Remove wallet not yet implemented in native engine")
            } else {
                try await walletKitEngine?.removeWallet(wallet.address)
            }
            await refreshState()
        } catch {
            throw WalletKitError.walletOperationFailed(error.localizedDescription)
        }
    }
    
    /// Clear all wallets
    public func clearWallets() async throws {
        do {
            if useNativeEngine {
                // Native engine clearWallets would need to be implemented
                print("⚠️ Clear wallets not yet implemented in native engine")
            } else {
                try await walletKitEngine?.clearWallets()
            }
            await refreshState()
        } catch {
            throw WalletKitError.walletOperationFailed(error.localizedDescription)
        }
    }
    
    // MARK: - Session Management
    
    /// List all active sessions
    public func getSessions() -> [SessionInfo] {
        return sessions
    }
    
    /// Disconnect session(s)
    public func disconnect(sessionId: String? = nil) async throws {
        do {
            if useNativeEngine {
                // Native engine disconnect would need to be implemented
                print("⚠️ Disconnect not yet implemented in native engine")
            } else {
                try await walletKitEngine?.disconnect(sessionId: sessionId)
            }
            await refreshState()
        } catch {
            throw WalletKitError.sessionOperationFailed(error.localizedDescription)
        }
    }
    
    // MARK: - URL Processing
    
    /// Handle pasted TON Connect URL/link
    public func handleTonConnectUrl(_ url: String) async throws {
        do {
            if useNativeEngine {
                try await nativeEngine?.handleTonConnectUrl(url)
            } else {
                try await walletKitEngine?.handleTonConnectUrl(url)
            }
        } catch {
            throw WalletKitError.urlProcessingFailed(error.localizedDescription)
        }
    }
    
    // MARK: - Request Processing
    
    /// Approve a connect request
    public func approveConnectRequest(_ event: ConnectRequestEvent, wallet: WalletInfo) async throws {
        do {
            if useNativeEngine {
                try await nativeEngine?.approveConnectRequest(event.id, walletAddress: wallet.address)
            } else {
                try await walletKitEngine?.approveConnectRequest(event.id, walletAddress: wallet.address)
            }
            await refreshState()
        } catch {
            throw WalletKitError.requestProcessingFailed(error.localizedDescription)
        }
    }
    
    /// Reject a connect request
    public func rejectConnectRequest(_ event: ConnectRequestEvent, reason: String? = nil) async throws {
        do {
            if useNativeEngine {
                // Native engine rejectConnectRequest would need to be implemented
                print("⚠️ Reject connect request not yet implemented in native engine")
            } else {
                try await walletKitEngine?.rejectConnectRequest(event.id, reason: reason)
            }
        } catch {
            throw WalletKitError.requestProcessingFailed(error.localizedDescription)
        }
    }
    
    /// Approve a transaction request
    public func approveTransactionRequest(_ event: TransactionRequestEvent) async throws -> TransactionResult {
        do {
            if useNativeEngine {
                // Native engine approveTransactionRequest would need to return proper result
                print("⚠️ Approve transaction request not yet implemented in native engine")
                return TransactionResult(hash: "mock_hash", signedBoc: "mock_boc")
            } else {
                return try await walletKitEngine?.approveTransactionRequest(event.id) ?? TransactionResult(hash: "error", signedBoc: "error")
            }
        } catch {
            throw WalletKitError.requestProcessingFailed(error.localizedDescription)
        }
    }
    
    /// Reject a transaction request
    public func rejectTransactionRequest(_ event: TransactionRequestEvent, reason: String? = nil) async throws {
        do {
            if useNativeEngine {
                // Native engine rejectTransactionRequest would need to be implemented
                print("⚠️ Reject transaction request not yet implemented in native engine")
            } else {
                try await walletKitEngine?.rejectTransactionRequest(event.id, reason: reason)
            }
        } catch {
            throw WalletKitError.requestProcessingFailed(error.localizedDescription)
        }
    }
    
    /// Sign data request
    public func approveSignDataRequest(_ event: SignDataRequestEvent) async throws -> SignDataResult {
        do {
            if useNativeEngine {
                // Native engine approveSignDataRequest would need to return proper result
                print("⚠️ Approve sign data request not yet implemented in native engine")
                return SignDataResult(signature: "mock_signature")
            } else {
                return try await walletKitEngine?.approveSignDataRequest(event.id) ?? SignDataResult(signature: "error")
            }
        } catch {
            throw WalletKitError.requestProcessingFailed(error.localizedDescription)
        }
    }
    
    /// Reject a sign data request
    public func rejectSignDataRequest(_ event: SignDataRequestEvent, reason: String? = nil) async throws {
        do {
            if useNativeEngine {
                // Native engine rejectSignDataRequest would need to be implemented
                print("⚠️ Reject sign data request not yet implemented in native engine")
            } else {
                try await walletKitEngine?.rejectSignDataRequest(event.id, reason: reason)
            }
        } catch {
            throw WalletKitError.requestProcessingFailed(error.localizedDescription)
        }
    }
    
    // MARK: - Jettons
    
    /// Get jetton information for a wallet
    public func getJettons(for wallet: WalletInfo) async throws -> [JettonInfo] {
        do {
            if useNativeEngine {
                // Native engine getJettons would need to be implemented
                print("⚠️ Get jettons not yet implemented in native engine")
                return []
            } else {
                return try await walletKitEngine?.getJettons(walletAddress: wallet.address) ?? []
            }
        } catch {
            throw WalletKitError.jettonOperationFailed(error.localizedDescription)
        }
    }
    
    // MARK: - State Management
    
    private func refreshState() async {
        do {
            if useNativeEngine {
                // For native engine, we'll get wallets differently
                if let walletsData = try await nativeEngine?.getWallets() {
                    // Convert from [[String: Any]] to [WalletInfo]
                    wallets = walletsData.compactMap { dict -> WalletInfo? in
                        guard let address = dict["address"] as? String,
                              let name = dict["name"] as? String,
                              let network = dict["network"] as? String else {
                            return nil
                        }
                        return WalletInfo(
                            address: address,
                            walletName: name,
                            network: network == "mainnet" ? .mainnet : .testnet,
                            version: dict["version"] as? String ?? "v5r1"
                        )
                    }
                }
                sessions = [] // Native engine sessions would need separate implementation
            } else {
                let (walletsData, sessionsData) = try await walletKitEngine?.getCurrentState() ?? ([], [])
                wallets = walletsData
                sessions = sessionsData
            }
        } catch {
            print("Failed to refresh state: \(error)")
        }
    }
    
    // MARK: - Lifecycle
    
    /// Clean shutdown
    public func close() async {
        if useNativeEngine {
            try? await nativeEngine?.close()
        } else {
            try? await walletKitEngine?.close()
        }
        cancellables.removeAll()
        isInitialized = false
    }
}

// MARK: - Configuration

public struct WalletKitConfig {
    public let apiKey: String?
    public let network: TonNetwork
    public let storage: StorageConfig
    public let manifestUrl: String
    
    public init(
        apiKey: String? = nil,
        network: TonNetwork = .mainnet,
        storage: StorageConfig = .local,
        manifestUrl: String
    ) {
        self.apiKey = apiKey
        self.network = network
        self.storage = storage
        self.manifestUrl = manifestUrl
    }
}

public enum StorageConfig {
    case local
    case memory
    case custom(String) // Custom storage identifier
}

public enum TonNetwork: String, CaseIterable, Codable {
    case mainnet = "-239"
    case testnet = "-3"
    
    public var chainId: String { rawValue }
}

// MARK: - Errors

public enum WalletKitError: Error, LocalizedError {
    case initializationFailed(String)
    case walletOperationFailed(String)
    case sessionOperationFailed(String)
    case urlProcessingFailed(String)
    case requestProcessingFailed(String)
    case jettonOperationFailed(String)
    case bridgeError(String)
    
    public var errorDescription: String? {
        switch self {
        case .initializationFailed(let message):
            return "Initialization failed: \(message)"
        case .walletOperationFailed(let message):
            return "Wallet operation failed: \(message)"
        case .sessionOperationFailed(let message):
            return "Session operation failed: \(message)"
        case .urlProcessingFailed(let message):
            return "URL processing failed: \(message)"
        case .requestProcessingFailed(let message):
            return "Request processing failed: \(message)"
        case .jettonOperationFailed(let message):
            return "Jetton operation failed: \(message)"
        case .bridgeError(let message):
            return "Bridge error: \(message)"
        }
    }
}
