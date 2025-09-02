//
//  WalletKitNativeEngine.swift
//  TonWalletKit Native Integration
//
//  Integrates the actual JavaScript WalletKit library using JavaScriptCore
//

import Foundation
import JavaScriptCore
import Combine
import os.log

/// Native engine that runs the actual WalletKit JavaScript library
class WalletKitNativeEngine: NSObject {
    
    // MARK: - Properties
    private var jsContext: JSContext?
    private var walletKitInstance: JSValue?
    private var isInitialized = false
    private let config: WalletKitConfig
    
    // Event handling
    private let eventSubject = PassthroughSubject<WalletKitEvent, Never>()
    var eventPublisher: AnyPublisher<WalletKitEvent, Never> {
        eventSubject.eraseToAnyPublisher()
    }
    
    // MARK: - Initialization
    
    init(config: WalletKitConfig) {
        self.config = config
        super.init()
    }
    
    /// Initialize the native WalletKit JavaScript environment
    func initialize() async throws {
        guard !isInitialized else { return }
        
        return try await withCheckedThrowingContinuation { continuation in
            DispatchQueue.global(qos: .userInitiated).async {
                do {
                    try self.setupJavaScriptContext()
                    try self.loadWalletKitLibrary()
                    try self.initializeWalletKit()
                    
                    self.isInitialized = true
                    print("✅ WalletKit Native Engine initialized successfully")
                    continuation.resume()
                } catch {
                    print("❌ WalletKit Native Engine initialization failed: \(error)")
                    continuation.resume(throwing: error)
                }
            }
        }
    }
    
    private func setupJavaScriptContext() throws {
        jsContext = JSContext()
        guard let context = jsContext else {
            throw WalletKitError.initializationFailed("Failed to create JavaScript context")
        }
        
        // Set up exception handler
        context.exceptionHandler = { context, exception in
            print("❌ JavaScript Exception: \(exception?.toString() ?? "Unknown")")
            if let stackTrace = exception?.objectForKeyedSubscript("stack") {
                print("Stack trace: \(stackTrace)")
            }
        }
        
        // Set up console logging
        let consoleLog: @convention(block) (String) -> Void = { message in
            print("🌐 WalletKit JS: \(message)")
        }
        
        context.setObject(consoleLog, forKeyedSubscript: "nativeLog" as NSString)
        
        // Add basic console object
        context.evaluateScript("""
            const console = {
                log: function(...args) {
                    nativeLog(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
                },
                warn: function(...args) { 
                    nativeLog('[WARN] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')); 
                },
                error: function(...args) { 
                    nativeLog('[ERROR] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')); 
                },
                info: function(...args) { 
                    nativeLog('[INFO] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')); 
                }
            };
        """)
        
        print("✅ JavaScript context initialized")
    }
    
    private func loadWalletKitLibrary() throws {
        guard let context = jsContext else {
            throw WalletKitError.initializationFailed("JavaScript context not initialized")
        }
        
        // For now, we'll create a minimal mock of the WalletKit library
        // In a real implementation, you would load the actual compiled WalletKit JavaScript code
        
        let walletKitMockScript = createWalletKitMock()
        
        let result = context.evaluateScript(walletKitMockScript)
        if result?.isUndefined == true {
            throw WalletKitError.initializationFailed("Failed to load WalletKit library")
        }
        
        print("✅ WalletKit library loaded")
    }
    
    private func initializeWalletKit() throws {
        guard let context = jsContext else {
            throw WalletKitError.initializationFailed("JavaScript context not initialized")
        }
        
        // Create WalletKit instance with configuration
        let initScript = """
            (async () => {
                try {
                    const config = {
                        network: '\(config.network.rawValue)',
                        storage: { type: 'memory' },
                        manifestUrl: '\(config.manifestUrl)'
                    };
                    
                    console.log('🔄 Initializing WalletKit with config:', JSON.stringify(config));
                    
                    window.walletKitInstance = new TonWalletKit(config);
                    await window.walletKitInstance.initialize();
                    
                    console.log('✅ WalletKit instance initialized');
                    
                    // Set up event listeners
                    window.walletKitInstance.onConnectRequest((event) => {
                        nativeEventCallback('connectRequest', JSON.stringify(event));
                    });
                    
                    window.walletKitInstance.onTransactionRequest((event) => {
                        nativeEventCallback('transactionRequest', JSON.stringify(event));
                    });
                    
                    window.walletKitInstance.onSignDataRequest((event) => {
                        nativeEventCallback('signDataRequest', JSON.stringify(event));
                    });
                    
                    window.walletKitInstance.onDisconnect((event) => {
                        nativeEventCallback('disconnect', JSON.stringify(event));
                    });
                    
                    return true;
                } catch (error) {
                    console.error('WalletKit initialization failed:', error.message);
                    throw error;
                }
            })()
        """
        
        // Set up native event callback
        let eventCallback: @convention(block) (String, String) -> Void = { eventType, eventData in
            self.handleJavaScriptEvent(eventType: eventType, data: eventData)
        }
        context.setObject(eventCallback, forKeyedSubscript: "nativeEventCallback" as NSString)
        
        let result = context.evaluateScript(initScript)
        
        // Wait for the promise to resolve (simplified)
        DispatchQueue.global().asyncAfter(deadline: .now() + 1.0) {
            if let instance = context.objectForKeyedSubscript("walletKitInstance") {
                self.walletKitInstance = instance
                print("✅ WalletKit instance ready")
                
                // Send initialization complete event
                self.eventSubject.send(.stateChanged)
            }
        }
    }
    
    private func handleJavaScriptEvent(eventType: String, data: String) {
        print("📨 Native Engine: Received JS event: \(eventType)")
        
        do {
            let jsonData = data.data(using: .utf8)!
            let eventDict = try JSONSerialization.jsonObject(with: jsonData) as! [String: Any]
            
            switch eventType {
            case "connectRequest":
                if let event = parseConnectRequestEvent(eventDict) {
                    eventSubject.send(.connectRequest(event))
                }
            case "transactionRequest":
                if let event = parseTransactionRequestEvent(eventDict) {
                    eventSubject.send(.transactionRequest(event))
                }
            case "signDataRequest":
                if let event = parseSignDataRequestEvent(eventDict) {
                    eventSubject.send(.signDataRequest(event))
                }
            case "disconnect":
                if let event = parseDisconnectEvent(eventDict) {
                    eventSubject.send(.disconnect(event))
                }
            default:
                print("⚠️ Unknown event type: \(eventType)")
            }
        } catch {
            print("❌ Failed to parse event data: \(error)")
        }
    }
    
    private func createWalletKitMock() -> String {
        return """
            // Mock TonWalletKit for iOS Integration
            // This is a simplified version - in production, you'd load the actual compiled library
            
            class TonWalletKit {
                constructor(config) {
                    this.config = config;
                    this.wallets = [];
                    this.sessions = [];
                    this.eventListeners = {
                        connectRequest: [],
                        transactionRequest: [],
                        signDataRequest: [],
                        disconnect: []
                    };
                    console.log('TonWalletKit Mock created with config:', JSON.stringify(config));
                }
                
                async initialize() {
                    console.log('TonWalletKit Mock initializing...');
                    // Simulate initialization delay
                    await new Promise(resolve => setTimeout(resolve, 100));
                    console.log('✅ TonWalletKit Mock initialized');
                }
                
                // Event handling
                onConnectRequest(callback) {
                    this.eventListeners.connectRequest.push(callback);
                }
                
                onTransactionRequest(callback) {
                    this.eventListeners.transactionRequest.push(callback);
                }
                
                onSignDataRequest(callback) {
                    this.eventListeners.signDataRequest.push(callback);
                }
                
                onDisconnect(callback) {
                    this.eventListeners.disconnect.push(callback);
                }
                
                // Wallet management
                async addWallet(walletConfig) {
                    console.log('Adding wallet:', JSON.stringify(walletConfig));
                    const wallet = {
                        address: 'EQ' + Math.random().toString(36).substring(7),
                        name: walletConfig.name || 'Wallet ' + (this.wallets.length + 1),
                        network: walletConfig.network || 'testnet',
                        version: walletConfig.version || 'v5r1'
                    };
                    this.wallets.push(wallet);
                    return wallet;
                }
                
                async removeWallet(address) {
                    console.log('Removing wallet:', address);
                    const index = this.wallets.findIndex(w => w.address === address);
                    if (index !== -1) {
                        this.wallets.splice(index, 1);
                    }
                    return { success: true };
                }
                
                async clearWallets() {
                    console.log('Clearing all wallets');
                    this.wallets = [];
                    return { success: true };
                }
                
                getWallets() {
                    return this.wallets;
                }
                
                getSessions() {
                    return this.sessions;
                }
                
                // Connection handling
                async handleTonConnectUrl(url) {
                    console.log('Handling TON Connect URL:', url);
                    
                    // Simulate a connect request
                    const connectRequest = {
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
                    
                    // Trigger connect request event
                    this.eventListeners.connectRequest.forEach(callback => {
                        try {
                            callback(connectRequest);
                        } catch (error) {
                            console.error('Error in connect request callback:', error);
                        }
                    });
                    
                    return { success: true };
                }
                
                async approveConnectRequest(requestId, walletAddress) {
                    console.log('Approving connect request:', requestId, 'for wallet:', walletAddress);
                    
                    const session = {
                        id: Math.random().toString(36).substring(7),
                        requestId,
                        walletAddress,
                        dAppName: 'Demo DApp',
                        connectedAt: Date.now()
                    };
                    
                    this.sessions.push(session);
                    return { success: true, session };
                }
                
                async rejectConnectRequest(requestId, reason) {
                    console.log('Rejecting connect request:', requestId, 'reason:', reason);
                    return { success: true };
                }
                
                // Add other methods as needed...
                async approveTransactionRequest(requestId) {
                    console.log('Approving transaction request:', requestId);
                    return { 
                        success: true, 
                        hash: 'tx_' + Math.random().toString(36).substring(7),
                        signedBoc: 'mock_signed_boc_data'
                    };
                }
                
                async rejectTransactionRequest(requestId, reason) {
                    console.log('Rejecting transaction request:', requestId, 'reason:', reason);
                    return { success: true };
                }
                
                async disconnect(sessionId) {
                    console.log('Disconnecting session:', sessionId);
                    if (sessionId) {
                        const index = this.sessions.findIndex(s => s.id === sessionId);
                        if (index !== -1) {
                            this.sessions.splice(index, 1);
                        }
                    } else {
                        this.sessions = [];
                    }
                    return { success: true };
                }
                
                async getJettons(walletAddress) {
                    console.log('Getting jettons for:', walletAddress);
                    return []; // Empty for now
                }
            }
            
            // Make available globally
            window.TonWalletKit = TonWalletKit;
        """
    }
    
    // MARK: - API Methods
    
    func addWallet(_ config: WalletConfig) async throws {
        guard let context = jsContext, let instance = walletKitInstance else {
            throw WalletKitError.bridgeError("WalletKit not initialized")
        }
        
        let configJSON = try JSONSerialization.data(withJSONObject: [
            "mnemonic": config.mnemonic,
            "name": config.name,
            "network": config.network.rawValue,
            "version": config.version
        ])
        
        let configString = String(data: configJSON, encoding: .utf8)!
        let script = "window.walletKitInstance.addWallet(\(configString))"
        
        let _ = context.evaluateScript(script)
    }
    
    func getWallets() async throws -> [[String: Any]] {
        guard let context = jsContext, let instance = walletKitInstance else {
            throw WalletKitError.bridgeError("WalletKit not initialized")
        }
        
        let result = context.evaluateScript("JSON.stringify(window.walletKitInstance.getWallets())")
        
        if let jsonString = result?.toString(),
           let jsonData = jsonString.data(using: .utf8),
           let walletsArray = try JSONSerialization.jsonObject(with: jsonData) as? [[String: Any]] {
            return walletsArray
        }
        
        return []
    }
    
    func handleTonConnectUrl(_ url: String) async throws {
        guard let context = jsContext, let instance = walletKitInstance else {
            throw WalletKitError.bridgeError("WalletKit not initialized")
        }
        
        let script = "window.walletKitInstance.handleTonConnectUrl('\(url)')"
        let _ = context.evaluateScript(script)
    }
    
    func approveConnectRequest(_ requestId: String, walletAddress: String) async throws {
        guard let context = jsContext, let instance = walletKitInstance else {
            throw WalletKitError.bridgeError("WalletKit not initialized")
        }
        
        let script = "window.walletKitInstance.approveConnectRequest('\(requestId)', '\(walletAddress)')"
        let _ = context.evaluateScript(script)
    }
    
    // Add other API methods as needed...
    
    // MARK: - Event Parsing (reuse from WalletKitEngine)
    
    private func parseConnectRequestEvent(_ data: [String: Any]) -> ConnectRequestEvent? {
        guard let jsonData = try? JSONSerialization.data(withJSONObject: data),
              let event = try? JSONDecoder().decode(ConnectRequestEvent.self, from: jsonData) else {
            return nil
        }
        return event
    }
    
    private func parseTransactionRequestEvent(_ data: [String: Any]) -> TransactionRequestEvent? {
        guard let jsonData = try? JSONSerialization.data(withJSONObject: data),
              let event = try? JSONDecoder().decode(TransactionRequestEvent.self, from: jsonData) else {
            return nil
        }
        return event
    }
    
    private func parseSignDataRequestEvent(_ data: [String: Any]) -> SignDataRequestEvent? {
        guard let jsonData = try? JSONSerialization.data(withJSONObject: data),
              let event = try? JSONDecoder().decode(SignDataRequestEvent.self, from: jsonData) else {
            return nil
        }
        return event
    }
    
    private func parseDisconnectEvent(_ data: [String: Any]) -> DisconnectEvent? {
        guard let jsonData = try? JSONSerialization.data(withJSONObject: data),
              let event = try? JSONDecoder().decode(DisconnectEvent.self, from: jsonData) else {
            return nil
        }
        return event
    }
    
    func close() async throws {
        isInitialized = false
        jsContext = nil
        walletKitInstance = nil
    }
}
