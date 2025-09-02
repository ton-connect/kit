//
//  WalletKitEngine.swift
//  TonWalletKit Engine
//
//  Bridge between Swift and JavaScript WalletKit
//

import Foundation
import WebKit
import Combine
import os.log

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
    
    // Request tracking with completion handlers
    private var pendingRequests: [String: (Bool, Any?) -> Void] = [:]
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
        async function initializeWalletKit() {
            console.log('🚀 Starting WalletKit initialization...');
            try {
                // Import WalletKit (this would be the actual import in a real implementation)
                // For now, we'll simulate the WalletKit interface
                
                console.log('Initializing WalletKit with config:', {
                    network: '\(config.network.rawValue)',
                    storage: '\(storageType)',
                    manifestUrl: '\(config.manifestUrl)'
                });
                
                // Test different console log levels
                console.info('WalletKit console logging is now active');
                console.warn('This is a warning message test');
                console.debug('Debug logging is working');
                
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
                        console.debug('Adding wallet with config:', config);
                        const wallet = {
                            address: 'EQ...' + Math.random().toString(36).substring(7),
                            name: config.name,
                            network: config.network,
                            version: config.version
                        };
                        this.wallets.push(wallet);
                        console.log('✅ Wallet added successfully:', wallet);
                        return wallet;
                    },
                    
                    async getWallets() {
                        return this.wallets;
                    },
                    
                    async getSessions() {
                        return this.sessions;
                    },
                    
                    async handleTonConnectUrl(url) {
                        console.info('🔗 Processing TON Connect URL:', url);
                        
                        try {
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
                            
                            console.log('📨 Generated connect request event:', event);
                            window.walletKitSwiftBridge.sendEvent('connectRequest', event);
                            return true;
                        } catch (error) {
                            console.error('❌ Failed to process TON Connect URL:', error);
                            throw error;
                        }
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
                
                console.log('🔄 About to initialize WalletKit...');
                await window.walletKit.initialize();
                console.log('✅ WalletKit.initialize() completed successfully');
                
                // Notify Swift that initialization is complete
                console.log('📤 Sending initialized event to Swift with success: true');
                window.walletKitSwiftBridge.sendEvent('initialized', { success: true });
                console.log('✅ Initialized event sent to Swift');
                
            } catch (error) {
                console.error('❌ WalletKit initialization failed:', error);
                console.error('Error details:', { message: error.message, stack: error.stack });
                console.log('📤 Sending initialized event to Swift with success: false');
                window.walletKitSwiftBridge.sendEvent('initialized', { 
                    success: false, 
                    error: error.message 
                });
                console.log('✅ Failed initialization event sent to Swift');
            }
        }
        
        // Set up initialization - handle both loading and already-loaded states
        document.addEventListener('DOMContentLoaded', initializeWalletKit);
        
        // Fallback: if document is already loaded, initialize immediately
        if (document.readyState === 'loading') {
            console.log('📄 Document is loading, waiting for DOMContentLoaded...');
        } else {
            console.log('📄 Document already loaded, initializing immediately...');
            initializeWalletKit();
        }
        
        // Console logging - intercept all console methods
        const originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error,
            info: console.info,
            debug: console.debug
        };
        
        function createConsoleHandler(level, originalMethod) {
            return function(...args) {
                const message = args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ');
                
                window.webkit.messageHandlers.consoleLog.postMessage({
                    level: level,
                    message: message,
                    timestamp: new Date().toISOString()
                });
                
                originalMethod.apply(console, args);
            };
        }
        
        console.log = createConsoleHandler('LOG', originalConsole.log);
        console.warn = createConsoleHandler('WARN', originalConsole.warn);
        console.error = createConsoleHandler('ERROR', originalConsole.error);
        console.info = createConsoleHandler('INFO', originalConsole.info);
        console.debug = createConsoleHandler('DEBUG', originalConsole.debug);
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
        
        print("🔍 WalletKit: Setting up initialization completion handler")
        
        eventPublisher
            .first { event in
                print("🔍 WalletKit: Received event: \(event)")
                if case .stateChanged = event {
                    print("✅ WalletKit: StateChanged event received - initialization complete!")
                    return true
                }
                return false
            }
            .sink { completion in
                print("🔍 WalletKit: Event publisher completed: \(completion)")
            } receiveValue: { _ in
                if !initializationHandled {
                    print("✅ WalletKit: Initialization successful!")
                    initializationHandled = true
                    completion(.success(()))
                }
            }
            .store(in: &cancellables)
        
        // Timeout after 15 seconds (increased from 10)
        DispatchQueue.global().asyncAfter(deadline: .now() + 15) {
            if !initializationHandled {
                print("❌ WalletKit: Initialization timeout after 15 seconds")
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
        
        return try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<T, Error>) in
            let requestId = UUID().uuidString
            
            // Store completion handler instead of continuation
            requestQueue.sync {
                self.pendingRequests[requestId] = { success, result in
                    if success {
                        if let typedResult = result as? T {
                            continuation.resume(returning: typedResult)
                        } else {
                            // Try to convert the result to the expected type
                            if T.self == [String: Any].self, let dictResult = result as? [String: Any] {
                                continuation.resume(returning: dictResult as! T)
                            } else if T.self == [[String: Any]].self, let arrayResult = result as? [[String: Any]] {
                                continuation.resume(returning: arrayResult as! T)
                            } else {
                                print("❌ WalletKit: Type mismatch - expected \(T.self), got \(type(of: result))")
                                continuation.resume(throwing: WalletKitError.bridgeError("Type mismatch in response"))
                            }
                        }
                    } else {
                        let errorMessage = result as? String ?? "Unknown error"
                        continuation.resume(throwing: WalletKitError.bridgeError(errorMessage))
                    }
                }
            }
            
            let script = "window.walletKit.\(method)(\(encodeJavaScriptArgs(args))).then(result => window.walletKitSwiftBridge.handleResponse('\(requestId)', true, result)).catch(error => window.walletKitSwiftBridge.handleResponse('\(requestId)', false, null, error.message))"
            
            print("🔍 WalletKit: Executing JavaScript: \(method) with args: \(args)")
            
            DispatchQueue.main.async {
                webView.evaluateJavaScript(script) { _, error in
                    if let error = error {
                        print("❌ WalletKit: JavaScript execution error: \(error.localizedDescription)")
                        self.requestQueue.sync {
                            if let handler = self.pendingRequests.removeValue(forKey: requestId) {
                                handler(false, error.localizedDescription)
                            }
                        }
                    }
                }
            }
            
            // Timeout after 30 seconds
            DispatchQueue.global().asyncAfter(deadline: .now() + 30) {
                self.requestQueue.sync {
                    if let handler = self.pendingRequests.removeValue(forKey: requestId) {
                        print("⏰ WalletKit: Request \(requestId) timed out")
                        handler(false, "Request timeout")
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
            for (_, handler) in pendingRequests {
                handler(false, "Bridge closed")
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
            handleConsoleLog(message.body)
        default:
            break
        }
    }
    
    private func handleConsoleLog(_ body: Any) {
        if let logData = body as? [String: Any],
           let level = logData["level"] as? String,
           let message = logData["message"] as? String,
           let timestamp = logData["timestamp"] as? String {
            
            // Format the log message with level and timestamp
            let formattedMessage = "🌐 WalletKit JS [\(level)] \(timestamp): \(message)"
            
            // Use NSLog for better Xcode console visibility
            NSLog("%@", formattedMessage)
            
            // Also use os_log for structured logging (iOS 10+)
            if #available(iOS 10.0, *) {
                let log = OSLog(subsystem: "com.walletkit.bridge", category: "JavaScript")
                
                switch level {
                case "ERROR":
                    os_log("%{public}@", log: log, type: .error, formattedMessage)
                case "WARN":
                    os_log("%{public}@", log: log, type: .default, formattedMessage)
                case "DEBUG":
                    os_log("%{public}@", log: log, type: .debug, formattedMessage)
                default:
                    os_log("%{public}@", log: log, type: .info, formattedMessage)
                }
            }
        } else if let simpleMessage = body as? String {
            // Fallback for simple string messages (backward compatibility)
            let formattedMessage = "🌐 WalletKit JS: \(simpleMessage)"
            NSLog("%@", formattedMessage)
        } else {
            // Fallback for any other format
            NSLog("🌐 WalletKit JS: %@", String(describing: body))
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
        print("🔍 WalletKit: Received bridge event message: \(messageDict)")
        
        guard let eventType = messageDict["eventType"] as? String,
              let data = messageDict["data"] as? [String: Any] else {
            print("❌ WalletKit: Invalid event message format")
            return
        }
        
        print("🔍 WalletKit: Processing event type: \(eventType), data: \(data)")
        
        switch eventType {
        case "initialized":
            if let success = data["success"] as? Bool, success {
                print("✅ WalletKit: JavaScript initialization successful, sending stateChanged event")
                eventSubject.send(.stateChanged)
            } else {
                print("❌ WalletKit: JavaScript initialization failed")
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
            print("❌ WalletKit: Invalid response message format")
            return
        }
        
        print("🔍 WalletKit: Handling response for request \(requestId), success: \(success)")
        
        requestQueue.sync {
            if let handler = self.pendingRequests.removeValue(forKey: requestId) {
                if success {
                    let result = messageDict["result"]
                    print("✅ WalletKit: Calling completion handler with result: \(String(describing: result))")
                    handler(true, result)
                } else {
                    let error = messageDict["error"] as? String ?? "Unknown error"
                    print("❌ WalletKit: Calling completion handler with error: \(error)")
                    handler(false, error)
                }
            } else {
                print("⚠️ WalletKit: No handler found for request \(requestId)")
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
