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
        
        // Add basic console object and window object
        context.evaluateScript("""
            // Create global window object for browser compatibility
            const window = globalThis || this || {};
            
            // Add basic console object
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
            
            // Make console available globally
            window.console = console;
            
            // Add other common browser globals that might be needed
            window.setTimeout = function(callback, delay) {
                // Note: This is a simplified implementation
                // In a real scenario, you might need a more robust timer implementation
                callback();
                return 1;
            };
            
            window.clearTimeout = function(id) {
                // Simplified implementation
            };
        """)
        
        print("✅ JavaScript context initialized")
    }
    
    private func loadWalletKitLibrary() throws {
        guard let context = jsContext else {
            throw WalletKitError.initializationFailed("JavaScript context not initialized")
        }
        
        do {
            // Load the actual compiled WalletKit JavaScript from ioskit.mjs
            let jsCode = try loadJavaScriptFromMJS()
            
            print("📋 Loading WalletKit JavaScript from ioskit.mjs (\(jsCode.count) characters)...")
            
            let result = context.evaluateScript(jsCode)
            
            // Check for evaluation success
            if let exception = context.exception {
                throw WalletKitError.initializationFailed("JavaScript execution failed: \(exception)")
            }
            
            print("✅ WalletKit JavaScript library loaded from ioskit.mjs")
            
        } catch {
            // If loading the actual library fails, fall back to mock for debugging
            print("⚠️ Failed to load actual WalletKit library, using mock: \(error)")
            
            let walletKitMockScript = createWalletKitMock()
            let result = context.evaluateScript(walletKitMockScript)
            
            if result?.isUndefined == true {
                throw WalletKitError.initializationFailed("Failed to load WalletKit library (including mock)")
            }
            
            print("✅ WalletKit mock library loaded")
        }
    }
    
    private func loadJavaScriptFromMJS() throws -> String {
        // Get the path to the compiled MJS file
        guard let bundlePath = Bundle.main.path(forResource: "dist-js/ioskit", ofType: "mjs") else {
            // Try alternative path
            let fallbackPath = Bundle.main.bundlePath + "/dist-js/ioskit.mjs"
            guard FileManager.default.fileExists(atPath: fallbackPath) else {
                throw WalletKitError.initializationFailed("Could not find compiled JavaScript bundle at dist-js/ioskit.mjs")
            }
            
            return try loadAndTransformMJS(from: fallbackPath)
        }
        
        return try loadAndTransformMJS(from: bundlePath)
    }
    
    private func loadAndTransformMJS(from path: String) throws -> String {
        let mjsContent = try String(contentsOfFile: path)
        
        // Transform the ES module to work in JavaScriptCore
        // Remove the export statement and make the main function available globally
        let transformedContent = mjsContent.replacingOccurrences(
            of: "export {\n  A3 as main\n};",
            with: """
            // Make main function available globally for JavaScriptCore
            var main = A3;
            
            // Auto-initialize on load
            console.log('🚀 WalletKit iOS Bridge starting from MJS...');
            try {
                main();
                console.log('✅ WalletKit main() called successfully from MJS');
            } catch (error) {
                console.error('❌ Error calling main() from MJS:', error);
            }
            """
        )
        
        return transformedContent
    }
    
    private func initializeWalletKit() throws {
        guard let context = jsContext else {
            throw WalletKitError.initializationFailed("JavaScript context not initialized")
        }
        
        // Set up Swift bridge for JavaScript
        let sendEventCallback: @convention(block) (String, JSValue) -> Void = { eventType, eventData in
            let eventString = eventData.toString() ?? "{}"
            print("📨 Swift Bridge: Received event '\(eventType)': \(eventString)")
            self.handleJavaScriptEvent(eventType: eventType, data: eventString)
        }
        
        let callNativeCallback: @convention(block) (String, JSValue) -> JSValue = { method, args in
            print("📞 Swift Bridge: Native call '\(method)' with args: \(args)")
            
            // Handle different native method calls
            switch method {
            case "addWallet":
                // Return a promise-like object for now
                return JSValue(object: ["success": true], in: context)!
            case "getWallets":
                // Return empty array for now
                return JSValue(object: [], in: context)!
            case "getSessions":
                // Return empty array for now
                return JSValue(object: [], in: context)!
            default:
                return JSValue(object: ["error": "Method not implemented"], in: context)!
            }
        }
        
        // Set up the Swift bridge object that JavaScript expects
        let bridgeSetupScript = """
            // Set up the Swift bridge that the JavaScript expects
            window.walletKitSwiftBridge = {
                config: {
                    network: '\(config.network.rawValue)',
                    storage: 'memory',
                    manifestUrl: '\(config.manifestUrl)',
                    isMobile: true,
                    isNative: true
                },
                sendEvent: sendEventCallback,
                callNative: callNativeCallback
            };
            
            console.log('✅ Swift bridge configured');
        """
        
        context.setObject(sendEventCallback, forKeyedSubscript: "sendEventCallback" as NSString)
        context.setObject(callNativeCallback, forKeyedSubscript: "callNativeCallback" as NSString)
        
        let result = context.evaluateScript(bridgeSetupScript)
        
        if let exception = context.exception {
            throw WalletKitError.initializationFailed("Bridge setup failed: \(exception)")
        }
        
        // The JavaScript should auto-initialize from the MJS file, so we just wait a bit
        DispatchQueue.global().asyncAfter(deadline: .now() + 2.0) {
            // Check if walletKit global was created
            if let walletKitGlobal = context.objectForKeyedSubscript("walletKit") {
                self.walletKitInstance = walletKitGlobal
                print("✅ WalletKit bridge instance ready")
                
                // Send initialization complete event
                self.eventSubject.send(.stateChanged)
            } else {
                print("⚠️ WalletKit global not found after initialization")
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
        let script = "window.walletKit.addWallet(\(configString))"
        
        let _ = context.evaluateScript(script)
    }
    
    func getWallets() async throws -> [[String: Any]] {
        guard let context = jsContext, let instance = walletKitInstance else {
            throw WalletKitError.bridgeError("WalletKit not initialized")
        }
        
        let result = context.evaluateScript("JSON.stringify(window.walletKit.getWallets())")
        
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
        
        let script = "window.walletKit.handleTonConnectUrl('\(url)')"
        let _ = context.evaluateScript(script)
    }
    
    func approveConnectRequest(_ requestId: String, walletAddress: String) async throws {
        guard let context = jsContext, let instance = walletKitInstance else {
            throw WalletKitError.bridgeError("WalletKit not initialized")
        }
        
        let script = "window.walletKit.approveConnectRequest('\(requestId)', '\(walletAddress)')"
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
    
    // MARK: - Debug/Inspection Methods
    
    /// Get access to the underlying JavaScript context for debugging
    /// Only available in DEBUG builds for security
    #if DEBUG
    func getJSContext() -> JSContext? {
        return jsContext
    }
    
    /// Execute arbitrary JavaScript for inspection/debugging
    func debugEvaluateScript(_ script: String) -> String? {
        guard let context = jsContext else { return nil }
        let result = context.evaluateScript(script)
        return result?.toString()
    }
    
    /// Get the current state of the WalletKit instance as JSON
    func debugGetWalletKitState() -> String? {
        return debugEvaluateScript("""
            JSON.stringify({
                walletKitAvailable: !!window.walletKit,
                bridgeAvailable: !!window.walletKitSwiftBridge,
                initialized: true
            }, null, 2)
        """)
    }
    
    /// Enable verbose logging for all JavaScript calls
    func enableVerboseLogging() {
        debugEvaluateScript("""
            // Override all console methods with verbose logging
            const originalLog = console.log;
            console.log = function(...args) {
                const stack = new Error().stack;
                nativeLog('[VERBOSE] ' + args.join(' ') + '\\nStack: ' + stack);
                originalLog.apply(console, args);
            };
        """)
    }
    #endif
}
