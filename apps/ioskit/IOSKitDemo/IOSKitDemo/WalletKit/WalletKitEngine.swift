//
//  WalletKitEngine.swift
//  TonWalletKit Engine
//
//  Bridge between Swift and JavaScript WalletKit
//

import Foundation
import WebKit
import Combine

/// Engine that bridges Swift API calls to JavaScript WalletKit
class WalletKitEngine: NSObject {
    
    // MARK: - Properties
    private var webView: WKWebView?
    private var isInitialized = false
    private let config: WalletKitConfig
    
    // Event handling
    private let eventSubject = PassthroughSubject<WalletKitEvent, Never>()
    var eventPublisher: AnyPublisher<WalletKitEvent, Never> {
        eventSubject.eraseToAnyPublisher()
    }
    
    // Request tracking
    private var pendingRequests: [String: CheckedContinuation<Any, Error>] = [:]
    private let requestQueue = DispatchQueue(label: "walletkit.requests", qos: .userInitiated)
    
    // MARK: - Initialization
    
    init(config: WalletKitConfig) {
        self.config = config
        super.init()
    }
    
    /// Initialize the WalletKit JavaScript environment
    func initialize() async throws {
        guard !isInitialized else { return }
        
        return try await withCheckedThrowingContinuation { continuation in
            DispatchQueue.main.async {
                self.setupWebView { result in
                    switch result {
                    case .success:
                        self.isInitialized = true
                        continuation.resume()
                    case .failure(let error):
                        continuation.resume(throwing: error)
                    }
                }
            }
        }
    }
    
    private func setupWebView(completion: @escaping (Result<Void, Error>) -> Void) {
        let webViewConfiguration = WKWebViewConfiguration()
        let userContentController = WKUserContentController()
        
        // Add message handlers for bridge communication
        userContentController.add(self, name: "walletKitBridge")
        userContentController.add(self, name: "consoleLog")
        
        // Inject WalletKit initialization
        let walletKitScript = createWalletKitInitScript()
        let bridgeScript = WKUserScript(source: walletKitScript, injectionTime: .atDocumentEnd, forMainFrameOnly: false)
        userContentController.addUserScript(bridgeScript)
        
        webViewConfiguration.userContentController = userContentController
        
        // Create WebView (hidden, used only for JavaScript execution)
        webView = WKWebView(frame: .zero, configuration: webViewConfiguration)
        webView?.navigationDelegate = self
        
        #if DEBUG
        if #available(iOS 16.4, *) {
            webView?.isInspectable = true
        }
        #endif
        
        // Load minimal HTML to initialize JavaScript environment
        let html = createMinimalHTML()
        webView?.loadHTMLString(html, baseURL: nil)
        
        // Setup completion handling
        setupInitializationCompletion(completion: completion)
    }
    
    private func createWalletKitInitScript() -> String {
        let storageType = storageTypeString(config.storage)
        
        return """
        // WalletKit Swift Bridge
        window.walletKitSwiftBridge = {
            callbacks: {},
            
            // Call native Swift method
            callNative: function(method, args) {
                return new Promise((resolve, reject) => {
                    const requestId = Math.random().toString(36).substring(7);
                    this.callbacks[requestId] = { resolve, reject };
                    
                    window.webkit.messageHandlers.walletKitBridge.postMessage({
                        type: 'request',
                        method: method,
                        args: args || [],
                        requestId: requestId
                    });
                });
            },
            
            // Handle response from Swift
            handleResponse: function(requestId, success, result, error) {
                const callback = this.callbacks[requestId];
                if (callback) {
                    delete this.callbacks[requestId];
                    if (success) {
                        callback.resolve(result);
                    } else {
                        callback.reject(new Error(error || 'Unknown error'));
                    }
                }
            },
            
            // Send event to Swift
            sendEvent: function(eventType, data) {
                window.webkit.messageHandlers.walletKitBridge.postMessage({
                    type: 'event',
                    eventType: eventType,
                    data: data
                });
            }
        };
        
        // Initialize WalletKit when document is ready
        document.addEventListener('DOMContentLoaded', async function() {
            try {
                // Import WalletKit (this would be the actual import in a real implementation)
                // For now, we'll simulate the WalletKit interface
                
                console.log('Initializing WalletKit with config:', {
                    network: '\(config.network.rawValue)',
                    storage: '\(storageType)',
                    manifestUrl: '\(config.manifestUrl)'
                });
                
                // Create WalletKit instance
                window.walletKit = {
                    // Simulate WalletKit methods
                    initialized: false,
                    wallets: [],
                    sessions: [],
                    
                    async initialize() {
                        this.initialized = true;
                        console.log('WalletKit initialized');
                        return true;
                    },
                    
                    async addWallet(config) {
                        const wallet = {
                            address: 'EQ...' + Math.random().toString(36).substring(7),
                            name: config.name,
                            network: config.network,
                            version: config.version
                        };
                        this.wallets.push(wallet);
                        console.log('Wallet added:', wallet);
                        return wallet;
                    },
                    
                    async getWallets() {
                        return this.wallets;
                    },
                    
                    async getSessions() {
                        return this.sessions;
                    },
                    
                    async handleTonConnectUrl(url) {
                        console.log('Handling TON Connect URL:', url);
                        // Simulate connect request event
                        const event = {
                            id: Math.random().toString(36).substring(7),
                            dAppName: 'Demo DApp',
                            dAppUrl: 'https://demo.tonconnect.org',
                            manifestUrl: 'https://demo.tonconnect.org/manifest.json',
                            requestedItems: ['ton_addr'],
                            permissions: [{
                                name: 'ton_addr',
                                title: 'Wallet Address',
                                description: 'Access to your wallet address'
                            }]
                        };
                        
                        window.walletKitSwiftBridge.sendEvent('connectRequest', event);
                        return true;
                    },
                    
                    // Add other methods as needed...
                    async approveConnectRequest(requestId, walletAddress) {
                        console.log('Approving connect request:', requestId, walletAddress);
                        return { success: true };
                    },
                    
                    async approveTransactionRequest(requestId) {
                        console.log('Approving transaction request:', requestId);
                        return {
                            hash: 'tx_' + Math.random().toString(36).substring(7),
                            signedBoc: 'signed_boc_data'
                        };
                    }
                };
                
                await window.walletKit.initialize();
                
                // Notify Swift that initialization is complete
                window.walletKitSwiftBridge.sendEvent('initialized', { success: true });
                
            } catch (error) {
                console.error('WalletKit initialization failed:', error);
                window.walletKitSwiftBridge.sendEvent('initialized', { 
                    success: false, 
                    error: error.message 
                });
            }
        });
        
        // Console logging
        const originalLog = console.log;
        console.log = function(...args) {
            window.webkit.messageHandlers.consoleLog.postMessage(args.join(' '));
            originalLog.apply(console, args);
        };
        """
    }
    
    private func createMinimalHTML() -> String {
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>WalletKit Bridge</title>
        </head>
        <body>
            <div id="walletkit-bridge" style="display: none;">WalletKit Bridge</div>
        </body>
        </html>
        """
    }
    
    private func storageTypeString(_ storage: StorageConfig) -> String {
        switch storage {
        case .local:
            return "local"
        case .memory:
            return "memory"
        case .custom(let identifier):
            return identifier
        }
    }
    
    private func setupInitializationCompletion(completion: @escaping (Result<Void, Error>) -> Void) {
        // Wait for initialization event from JavaScript
        var initializationHandled = false
        
        eventPublisher
            .first { event in
                if case .stateChanged = event {
                    return true
                }
                return false
            }
            .sink { _ in
                if !initializationHandled {
                    initializationHandled = true
                    completion(.success(()))
                }
            } receiveValue: { _ in }
            .store(in: &cancellables)
        
        // Timeout after 10 seconds
        DispatchQueue.global().asyncAfter(deadline: .now() + 10) {
            if !initializationHandled {
                initializationHandled = true
                completion(.failure(WalletKitError.initializationFailed("Initialization timeout")))
            }
        }
    }
    
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - JavaScript Bridge Methods
    
    private func callJavaScript<T>(_ method: String, args: [Any] = []) async throws -> T {
        guard isInitialized, let webView = webView else {
            throw WalletKitError.bridgeError("WalletKit not initialized")
        }
        
        return try await withCheckedThrowingContinuation { continuation in
            let requestId = UUID().uuidString
            
            requestQueue.sync {
                self.pendingRequests[requestId] = continuation as! CheckedContinuation<Any, Error>
            }
            
            let script = "window.walletKit.\(method)(\(encodeJavaScriptArgs(args))).then(result => window.walletKitSwiftBridge.handleResponse('\(requestId)', true, result)).catch(error => window.walletKitSwiftBridge.handleResponse('\(requestId)', false, null, error.message))"
            
            DispatchQueue.main.async {
                webView.evaluateJavaScript(script) { _, error in
                    if let error = error {
                        self.requestQueue.sync {
                            if let continuation = self.pendingRequests.removeValue(forKey: requestId) {
                                continuation.resume(throwing: WalletKitError.bridgeError(error.localizedDescription))
                            }
                        }
                    }
                }
            }
            
            // Timeout after 30 seconds
            DispatchQueue.global().asyncAfter(deadline: .now() + 30) {
                self.requestQueue.sync {
                    if let continuation = self.pendingRequests.removeValue(forKey: requestId) {
                        continuation.resume(throwing: WalletKitError.bridgeError("Request timeout"))
                    }
                }
            }
        }
    }
    
    private func encodeJavaScriptArgs(_ args: [Any]) -> String {
        do {
            let data = try JSONSerialization.data(withJSONObject: args, options: [])
            guard let string = String(data: data, encoding: .utf8) else {
                return "[]"
            }
            return string.dropFirst().dropLast().description // Remove array brackets
        } catch {
            return "[]"
        }
    }
    
    // MARK: - Public API Methods
    
    func addWallet(_ config: WalletConfig) async throws {
        let configDict: [String: Any] = [
            "mnemonic": config.mnemonic,
            "name": config.name,
            "network": config.network.rawValue,
            "version": config.version
        ]
        
        let _: [String: Any] = try await callJavaScript("addWallet", args: [configDict])
    }
    
    func removeWallet(_ address: String) async throws {
        let _: [String: Any] = try await callJavaScript("removeWallet", args: [address])
    }
    
    func clearWallets() async throws {
        let _: [String: Any] = try await callJavaScript("clearWallets")
    }
    
    func getCurrentState() async throws -> ([WalletInfo], [SessionInfo]) {
        let walletsData: [[String: Any]] = try await callJavaScript("getWallets")
        let sessionsData: [[String: Any]] = try await callJavaScript("getSessions")
        
        let wallets = try walletsData.compactMap { dict -> WalletInfo? in
            guard let data = try? JSONSerialization.data(withJSONObject: dict),
                  let wallet = try? JSONDecoder().decode(WalletInfo.self, from: data) else {
                return nil
            }
            return wallet
        }
        
        let sessions = try sessionsData.compactMap { dict -> SessionInfo? in
            guard let data = try? JSONSerialization.data(withJSONObject: dict),
                  let session = try? JSONDecoder().decode(SessionInfo.self, from: data) else {
                return nil
            }
            return session
        }
        
        return (wallets, sessions)
    }
    
    func disconnect(sessionId: String?) async throws {
        if let sessionId = sessionId {
            let _: [String: Any] = try await callJavaScript("disconnect", args: [sessionId])
        } else {
            let _: [String: Any] = try await callJavaScript("disconnect")
        }
    }
    
    func handleTonConnectUrl(_ url: String) async throws {
        let _: [String: Any] = try await callJavaScript("handleTonConnectUrl", args: [url])
    }
    
    func approveConnectRequest(_ requestId: String, walletAddress: String) async throws {
        let _: [String: Any] = try await callJavaScript("approveConnectRequest", args: [requestId, walletAddress])
    }
    
    func rejectConnectRequest(_ requestId: String, reason: String?) async throws {
        let args = reason != nil ? [requestId, reason!] : [requestId]
        let _: [String: Any] = try await callJavaScript("rejectConnectRequest", args: args)
    }
    
    func approveTransactionRequest(_ requestId: String) async throws -> TransactionResult {
        let resultDict: [String: Any] = try await callJavaScript("approveTransactionRequest", args: [requestId])
        
        guard let data = try? JSONSerialization.data(withJSONObject: resultDict),
              let result = try? JSONDecoder().decode(TransactionResult.self, from: data) else {
            throw WalletKitError.bridgeError("Failed to decode transaction result")
        }
        
        return result
    }
    
    func rejectTransactionRequest(_ requestId: String, reason: String?) async throws {
        let args = reason != nil ? [requestId, reason!] : [requestId]
        let _: [String: Any] = try await callJavaScript("rejectTransactionRequest", args: args)
    }
    
    func approveSignDataRequest(_ requestId: String) async throws -> SignDataResult {
        let resultDict: [String: Any] = try await callJavaScript("approveSignDataRequest", args: [requestId])
        
        guard let data = try? JSONSerialization.data(withJSONObject: resultDict),
              let result = try? JSONDecoder().decode(SignDataResult.self, from: data) else {
            throw WalletKitError.bridgeError("Failed to decode sign data result")
        }
        
        return result
    }
    
    func rejectSignDataRequest(_ requestId: String, reason: String?) async throws {
        let args = reason != nil ? [requestId, reason!] : [requestId]
        let _: [String: Any] = try await callJavaScript("rejectSignDataRequest", args: args)
    }
    
    func getJettons(walletAddress: String) async throws -> [JettonInfo] {
        let jettonsData: [[String: Any]] = try await callJavaScript("getJettons", args: [walletAddress])
        
        let jettons = try jettonsData.compactMap { dict -> JettonInfo? in
            guard let data = try? JSONSerialization.data(withJSONObject: dict),
                  let jetton = try? JSONDecoder().decode(JettonInfo.self, from: data) else {
                return nil
            }
            return jetton
        }
        
        return jettons
    }
    
    func close() async throws {
        isInitialized = false
        
        DispatchQueue.main.async {
            self.webView?.navigationDelegate = nil
            self.webView = nil
        }
        
        // Cancel all pending requests
        requestQueue.sync {
            for (_, continuation) in pendingRequests {
                continuation.resume(throwing: WalletKitError.bridgeError("Bridge closed"))
            }
            pendingRequests.removeAll()
        }
        
        cancellables.removeAll()
    }
}

// MARK: - WKScriptMessageHandler

extension WalletKitEngine: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        switch message.name {
        case "walletKitBridge":
            handleBridgeMessage(message.body)
        case "consoleLog":
            print("WalletKit JS: \(message.body)")
        default:
            break
        }
    }
    
    private func handleBridgeMessage(_ body: Any) {
        guard let messageDict = body as? [String: Any],
              let type = messageDict["type"] as? String else {
            print("Invalid bridge message format")
            return
        }
        
        switch type {
        case "event":
            handleEventMessage(messageDict)
        case "response":
            handleResponseMessage(messageDict)
        default:
            print("Unknown bridge message type: \(type)")
        }
    }
    
    private func handleEventMessage(_ messageDict: [String: Any]) {
        guard let eventType = messageDict["eventType"] as? String,
              let data = messageDict["data"] as? [String: Any] else {
            return
        }
        
        switch eventType {
        case "initialized":
            if let success = data["success"] as? Bool, success {
                eventSubject.send(.stateChanged)
            }
        case "connectRequest":
            if let event = parseConnectRequestEvent(data) {
                eventSubject.send(.connectRequest(event))
            }
        case "transactionRequest":
            if let event = parseTransactionRequestEvent(data) {
                eventSubject.send(.transactionRequest(event))
            }
        case "signDataRequest":
            if let event = parseSignDataRequestEvent(data) {
                eventSubject.send(.signDataRequest(event))
            }
        case "disconnect":
            if let event = parseDisconnectEvent(data) {
                eventSubject.send(.disconnect(event))
            }
        default:
            print("Unknown event type: \(eventType)")
        }
    }
    
    private func handleResponseMessage(_ messageDict: [String: Any]) {
        guard let requestId = messageDict["requestId"] as? String,
              let success = messageDict["success"] as? Bool else {
            return
        }
        
        requestQueue.sync {
            if let continuation = self.pendingRequests.removeValue(forKey: requestId) {
                if success {
                    let result = messageDict["result"] ?? [:]
                    continuation.resume(returning: result)
                } else {
                    let error = messageDict["error"] as? String ?? "Unknown error"
                    continuation.resume(throwing: WalletKitError.bridgeError(error))
                }
            }
        }
    }
    
    // MARK: - Event Parsing
    
    private func parseConnectRequestEvent(_ data: [String: Any]) -> ConnectRequestEvent? {
        guard let data = try? JSONSerialization.data(withJSONObject: data),
              let event = try? JSONDecoder().decode(ConnectRequestEvent.self, from: data) else {
            return nil
        }
        return event
    }
    
    private func parseTransactionRequestEvent(_ data: [String: Any]) -> TransactionRequestEvent? {
        guard let data = try? JSONSerialization.data(withJSONObject: data),
              let event = try? JSONDecoder().decode(TransactionRequestEvent.self, from: data) else {
            return nil
        }
        return event
    }
    
    private func parseSignDataRequestEvent(_ data: [String: Any]) -> SignDataRequestEvent? {
        guard let data = try? JSONSerialization.data(withJSONObject: data),
              let event = try? JSONDecoder().decode(SignDataRequestEvent.self, from: data) else {
            return nil
        }
        return event
    }
    
    private func parseDisconnectEvent(_ data: [String: Any]) -> DisconnectEvent? {
        guard let data = try? JSONSerialization.data(withJSONObject: data),
              let event = try? JSONDecoder().decode(DisconnectEvent.self, from: data) else {
            return nil
        }
        return event
    }
}

// MARK: - WKNavigationDelegate

extension WalletKitEngine: WKNavigationDelegate {
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        print("WalletKit bridge WebView loaded")
    }
    
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("WalletKit bridge WebView failed to load: \(error)")
        eventSubject.send(.stateChanged)
    }
}
