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
    private let walletKitEngine: WalletKitEngine
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Event Handlers
    public var onConnectRequest: ((ConnectRequestEvent) -> Void)?
    public var onTransactionRequest: ((TransactionRequestEvent) -> Void)?
    public var onSignDataRequest: ((SignDataRequestEvent) -> Void)?
    public var onDisconnect: ((DisconnectEvent) -> Void)?
    
    // MARK: - Initialization
    
    public init(config: WalletKitConfig) {
        self.walletKitEngine = WalletKitEngine(config: config)
        setupEventHandlers()
    }
    
    /// Initialize the WalletKit system
    public func initialize() async throws {
        do {
            try await walletKitEngine.initialize()
            await refreshState()
            isInitialized = true
        } catch {
            throw WalletKitError.initializationFailed(error.localizedDescription)
        }
    }
    
    private func setupEventHandlers() {
        walletKitEngine.eventPublisher
            .receive(on: DispatchQueue.main)
            .sink { [weak self] event in
                self?.handleWalletKitEvent(event)
            }
            .store(in: &cancellables)
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
            try await walletKitEngine.addWallet(config)
            await refreshState()
        } catch {
            throw WalletKitError.walletOperationFailed(error.localizedDescription)
        }
    }
    
    /// Remove a wallet
    public func removeWallet(_ wallet: WalletInfo) async throws {
        do {
            try await walletKitEngine.removeWallet(wallet.address)
            await refreshState()
        } catch {
            throw WalletKitError.walletOperationFailed(error.localizedDescription)
        }
    }
    
    /// Clear all wallets
    public func clearWallets() async throws {
        do {
            try await walletKitEngine.clearWallets()
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
            try await walletKitEngine.disconnect(sessionId: sessionId)
            await refreshState()
        } catch {
            throw WalletKitError.sessionOperationFailed(error.localizedDescription)
        }
    }
    
    // MARK: - URL Processing
    
    /// Handle pasted TON Connect URL/link
    public func handleTonConnectUrl(_ url: String) async throws {
        do {
            try await walletKitEngine.handleTonConnectUrl(url)
        } catch {
            throw WalletKitError.urlProcessingFailed(error.localizedDescription)
        }
    }
    
    // MARK: - Request Processing
    
    /// Approve a connect request
    public func approveConnectRequest(_ event: ConnectRequestEvent, wallet: WalletInfo) async throws {
        do {
            try await walletKitEngine.approveConnectRequest(event.id, walletAddress: wallet.address)
            await refreshState()
        } catch {
            throw WalletKitError.requestProcessingFailed(error.localizedDescription)
        }
    }
    
    /// Reject a connect request
    public func rejectConnectRequest(_ event: ConnectRequestEvent, reason: String? = nil) async throws {
        do {
            try await walletKitEngine.rejectConnectRequest(event.id, reason: reason)
        } catch {
            throw WalletKitError.requestProcessingFailed(error.localizedDescription)
        }
    }
    
    /// Approve a transaction request
    public func approveTransactionRequest(_ event: TransactionRequestEvent) async throws -> TransactionResult {
        do {
            return try await walletKitEngine.approveTransactionRequest(event.id)
        } catch {
            throw WalletKitError.requestProcessingFailed(error.localizedDescription)
        }
    }
    
    /// Reject a transaction request
    public func rejectTransactionRequest(_ event: TransactionRequestEvent, reason: String? = nil) async throws {
        do {
            try await walletKitEngine.rejectTransactionRequest(event.id, reason: reason)
        } catch {
            throw WalletKitError.requestProcessingFailed(error.localizedDescription)
        }
    }
    
    /// Sign data request
    public func approveSignDataRequest(_ event: SignDataRequestEvent) async throws -> SignDataResult {
        do {
            return try await walletKitEngine.approveSignDataRequest(event.id)
        } catch {
            throw WalletKitError.requestProcessingFailed(error.localizedDescription)
        }
    }
    
    /// Reject a sign data request
    public func rejectSignDataRequest(_ event: SignDataRequestEvent, reason: String? = nil) async throws {
        do {
            try await walletKitEngine.rejectSignDataRequest(event.id, reason: reason)
        } catch {
            throw WalletKitError.requestProcessingFailed(error.localizedDescription)
        }
    }
    
    // MARK: - Jettons
    
    /// Get jetton information for a wallet
    public func getJettons(for wallet: WalletInfo) async throws -> [JettonInfo] {
        do {
            return try await walletKitEngine.getJettons(walletAddress: wallet.address)
        } catch {
            throw WalletKitError.jettonOperationFailed(error.localizedDescription)
        }
    }
    
    // MARK: - State Management
    
    private func refreshState() async {
        do {
            let (walletsData, sessionsData) = try await walletKitEngine.getCurrentState()
            wallets = walletsData
            sessions = sessionsData
        } catch {
            print("Failed to refresh state: \(error)")
        }
    }
    
    // MARK: - Lifecycle
    
    /// Clean shutdown
    public func close() async {
        try? await walletKitEngine.close()
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
