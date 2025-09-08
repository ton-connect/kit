//
//  WalletKitEngine.swift
//  TonWalletKit Engine Protocol
//
//  Common interface for different WalletKit engine implementations
//

import Foundation
import Combine

/// Protocol that all WalletKit engines must implement
public protocol WalletKitEngine: AnyObject {
    
    // MARK: - Properties
    var eventPublisher: AnyPublisher<WalletKitEvent, Never> { get }
    
    // MARK: - Lifecycle
    func initialize() async throws
    func close() async throws
    
    // MARK: - Wallet Management
    func addWallet(_ config: WalletConfig) async throws
    func getWallets() async throws -> [[String: Any]]
    func removeWallet(_ address: String) async throws
    func clearWallets() async throws
    
    // MARK: - Session Management
    func getSessions() async throws -> [[String: Any]]
    func disconnect(_ sessionId: String) async throws
    
    // MARK: - URL Processing
    func handleTonConnectUrl(_ url: String) async throws
    
    // MARK: - Request Processing
    func approveConnectRequest(_ requestId: String, walletAddress: String) async throws
    func rejectConnectRequest(_ requestId: String, reason: String) async throws
    func approveTransactionRequest(_ requestId: String) async throws
    func rejectTransactionRequest(_ requestId: String, reason: String) async throws
    func approveSignDataRequest(_ requestId: String) async throws
    func rejectSignDataRequest(_ requestId: String, reason: String) async throws
    
    // MARK: - Jettons
    func getJettons(_ walletAddress: String) async throws -> [[String: Any]]
}

/// Engine type enumeration
public enum WalletKitEngineType: String, CaseIterable {
    case native = "native"
    case webView = "webview"
    
    public var displayName: String {
        switch self {
        case .native:
            return "Native JavaScriptCore"
        case .webView:
            return "WebView (Debuggable)"
        }
    }
    
    public var description: String {
        switch self {
        case .native:
            return "Uses JavaScriptCore directly for optimal performance"
        case .webView:
            return "Uses WKWebView with Safari debugging support"
        }
    }
    
    public var icon: String {
        switch self {
        case .native:
            return "gearshape.2"
        case .webView:
            return "safari"
        }
    }
    
    public var debuggingSupport: Bool {
        switch self {
        case .native:
            return false
        case .webView:
            return true
        }
    }
    
    @MainActor
    public func createEngine(config: WalletKitConfig) -> WalletKitEngine {
        switch self {
        case .native:
            return WalletKitNativeEngine(config: config)
        case .webView:
            return WalletKitWebViewEngine(config: config)
        }
    }
}
