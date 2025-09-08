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
import JavaScriptCoreExtras
import Security

/// Native engine that runs the actual WalletKit JavaScript library
class WalletKitNativeEngine: NSObject, WalletKitEngine {
    
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
        
        // Set up secure random function for crypto.getRandomValues polyfill
        let getSecureRandomBytes: @convention(block) (Int) -> JSValue = { [weak self] length in
            guard let self = self, let context = self.jsContext else {
                return JSValue(undefinedIn: context)
            }
            
            do {
                let randomBytes = try self.generateSecureRandomBytes(count: length)
                let jsArray = JSValue(newArrayIn: context)!
                
                for (index, byte) in randomBytes.enumerated() {
                    jsArray.setObject(NSNumber(value: byte), atIndexedSubscript: index)
                }
                
                return jsArray
            } catch {
                print("❌ Failed to generate secure random bytes: \(error)")
                return JSValue(undefinedIn: context)
            }
        }
        
        TimerJS.registerInto(jsContext: context)
        // JSIntervals.provideToContext(context: context)
        try context.install([.fetch])
        
        context.setObject(consoleLog, forKeyedSubscript: "nativeLog" as NSString)
        context.setObject(getSecureRandomBytes, forKeyedSubscript: "getSecureRandomBytes" as NSString)
        
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
                },
                debug: function(...args) { 
                    nativeLog('[DEBUG] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')); 
                }
            };
            
            // Set up crypto polyfill using Swift's secure random
            const crypto = {
                getRandomValues: function(array) {
                    if (!array) {
                        throw new Error('crypto.getRandomValues: array is required');
                    }
                    
                    // Check if it's a typed array
                    if (!(array instanceof Int8Array || array instanceof Uint8Array || 
                          array instanceof Uint8ClampedArray || array instanceof Int16Array || 
                          array instanceof Uint16Array || array instanceof Int32Array || 
                          array instanceof Uint32Array)) {
                        throw new Error('crypto.getRandomValues: argument must be a typed array');
                    }
                    
                    // Get random bytes from Swift
                    const randomBytes = getSecureRandomBytes(array.length);
                    if (!randomBytes) {
                        throw new Error('crypto.getRandomValues: failed to generate random bytes');
                    }
                    
                    // Fill the array with random values
                    for (let i = 0; i < array.length; i++) {
                        array[i] = randomBytes[i];
                    }
                    
                    return array;
                },
                
                // Add randomUUID for completeness (using crypto.getRandomValues)
                randomUUID: function() {
                    const bytes = new Uint8Array(16);
                    this.getRandomValues(bytes);
                    
                    // Set version (4) and variant bits according to RFC 4122
                    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
                    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10
                    
                    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
                    return hex.substring(0, 8) + '-' + hex.substring(8, 12) + '-' + 
                           hex.substring(12, 16) + '-' + hex.substring(16, 20) + '-' + 
                           hex.substring(20, 32);
                }
            };
            
            // Make console and crypto available globally
            window.console = console;
            window.crypto = crypto;
            globalThis.crypto = crypto;
            self = {}
            self.crypto = crypto;
        """)
        
        print("✅ JavaScript context initialized")
    }
    
    /// Generate cryptographically secure random bytes using Swift's Security framework
    private func generateSecureRandomBytes(count: Int) throws -> [UInt8] {
        guard count > 0 else {
            throw WalletKitError.initializationFailed("Random bytes count must be positive")
        }
        
        var randomBytes = [UInt8](repeating: 0, count: count)
        let result = SecRandomCopyBytes(kSecRandomDefault, count, &randomBytes)
        
        guard result == errSecSuccess else {
            throw WalletKitError.initializationFailed("Failed to generate secure random bytes: \(result)")
        }
        
        return randomBytes
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
            print("❌ Failed to load WalletKit library: \(error)")
            throw WalletKitError.initializationFailed("Failed to load WalletKit library: \(error)")
        }
    }
    
    private func loadJavaScriptFromMJS() throws -> String {
        // Get the path to the compiled MJS file
        // Try multiple approaches to find the file
        
        // Option 1: Look for the file as a bundle resource (flattened path)
        if let bundlePath = Bundle.main.path(forResource: "ioskit", ofType: "mjs") {
            print("📍 Found bundle at main resource path: \(bundlePath)")
            return try loadAndTransformMJS(from: bundlePath)
        }
        
        // Option 2: Try nested resource path
        if let bundlePath = Bundle.main.path(forResource: "dist-js/ioskit", ofType: "mjs") {
            print("📍 Found bundle at nested resource path: \(bundlePath)")
            return try loadAndTransformMJS(from: bundlePath)
        }
        
        // Option 3: Try direct file path in bundle
        let fallbackPath = Bundle.main.bundlePath + "/dist-js/ioskit.mjs"
        if FileManager.default.fileExists(atPath: fallbackPath) {
            print("📍 Found bundle at fallback path: \(fallbackPath)")
            return try loadAndTransformMJS(from: fallbackPath)
        }
        
        // Option 4: Try alternative bundle structure
        let alternativePath = Bundle.main.resourcePath! + "/dist-js/ioskit.mjs"
        if FileManager.default.fileExists(atPath: alternativePath) {
            print("📍 Found bundle at alternative path: \(alternativePath)")
            return try loadAndTransformMJS(from: alternativePath)
        }
        
        // Debug: List available files to help diagnose the issue
        print("❌ Bundle search failed. Bundle info:")
        print("   Bundle path: \(Bundle.main.bundlePath)")
        print("   Resource path: \(Bundle.main.resourcePath ?? "nil")")
        
        if let resourcePath = Bundle.main.resourcePath {
            do {
                let contents = try FileManager.default.contentsOfDirectory(atPath: resourcePath)
                print("   Contents: \(contents.prefix(10))") // Show first 10 files
            } catch {
                print("   Could not list contents: \(error)")
            }
        }
        
        throw WalletKitError.initializationFailed("Could not find compiled JavaScript bundle at dist-js/ioskit.mjs. Tried multiple paths.")
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
        
        // Set up the Swift bridge object that JavaScript expects
        // Only keep sendEvent since Swift will call JS directly (no callNative needed)
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
                sendEvent: sendEventCallback
            };
            
            console.log('✅ Swift bridge configured (events only - Swift calls JS directly)');
        """
        
        context.setObject(sendEventCallback, forKeyedSubscript: "sendEventCallback" as NSString)
        
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
    

    
    // MARK: - API Methods
    
    func addWallet(_ config: WalletConfig) async throws {
        guard let context = jsContext, let instance = walletKitInstance else {
            throw WalletKitError.bridgeError("WalletKit not initialized")
        }
        
        let configJSON = try JSONSerialization.data(withJSONObject: [
            "mnemonic": config.mnemonic,
            "name": config.name,
            "network": "mainnet", //config.network.rawValue,
            "version": config.version,
            "mnemonicType": "ton"
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
    
    func removeWallet(_ address: String) async throws {
        guard let context = jsContext, let instance = walletKitInstance else {
            throw WalletKitError.bridgeError("WalletKit not initialized")
        }
        
        let script = "window.walletKit.removeWallet('\(address)')"
        let _ = context.evaluateScript(script)
    }
    
    func clearWallets() async throws {
        guard let context = jsContext, let instance = walletKitInstance else {
            throw WalletKitError.bridgeError("WalletKit not initialized")
        }
        
        let script = "window.walletKit.clearWallets()"
        let _ = context.evaluateScript(script)
    }
    
    func getSessions() async throws -> [[String: Any]] {
        guard let context = jsContext, let instance = walletKitInstance else {
            throw WalletKitError.bridgeError("WalletKit not initialized")
        }
        
        let result = context.evaluateScript("JSON.stringify(window.walletKit.getSessions())")
        
        if let jsonString = result?.toString(),
           let jsonData = jsonString.data(using: .utf8),
           let sessionsArray = try JSONSerialization.jsonObject(with: jsonData) as? [[String: Any]] {
            return sessionsArray
        }
        
        return []
    }
    
    func approveConnectRequest(_ requestId: String, walletAddress: String) async throws {
        guard let context = jsContext, let instance = walletKitInstance else {
            throw WalletKitError.bridgeError("WalletKit not initialized")
        }
        
        let script = "window.walletKit.approveConnectRequest('\(requestId)', '\(walletAddress)')"
        let _ = context.evaluateScript(script)
    }
    
    func rejectConnectRequest(_ requestId: String, reason: String) async throws {
        guard let context = jsContext, let instance = walletKitInstance else {
            throw WalletKitError.bridgeError("WalletKit not initialized")
        }
        
        let script = "window.walletKit.rejectConnectRequest('\(requestId)', '\(reason)')"
        let _ = context.evaluateScript(script)
    }
    
    func approveTransactionRequest(_ requestId: String) async throws {
        guard let context = jsContext, let instance = walletKitInstance else {
            throw WalletKitError.bridgeError("WalletKit not initialized")
        }
        
        let script = "window.walletKit.approveTransactionRequest('\(requestId)')"
        let _ = context.evaluateScript(script)
    }
    
    func rejectTransactionRequest(_ requestId: String, reason: String) async throws {
        guard let context = jsContext, let instance = walletKitInstance else {
            throw WalletKitError.bridgeError("WalletKit not initialized")
        }
        
        let script = "window.walletKit.rejectTransactionRequest('\(requestId)', '\(reason)')"
        let _ = context.evaluateScript(script)
    }
    
    func approveSignDataRequest(_ requestId: String) async throws {
        guard let context = jsContext, let instance = walletKitInstance else {
            throw WalletKitError.bridgeError("WalletKit not initialized")
        }
        
        let script = "window.walletKit.approveSignDataRequest('\(requestId)')"
        let _ = context.evaluateScript(script)
    }
    
    func rejectSignDataRequest(_ requestId: String, reason: String) async throws {
        guard let context = jsContext, let instance = walletKitInstance else {
            throw WalletKitError.bridgeError("WalletKit not initialized")
        }
        
        let script = "window.walletKit.rejectSignDataRequest('\(requestId)', '\(reason)')"
        let _ = context.evaluateScript(script)
    }
    
    func disconnect(_ sessionId: String) async throws {
        guard let context = jsContext, let instance = walletKitInstance else {
            throw WalletKitError.bridgeError("WalletKit not initialized")
        }
        
        let script = "window.walletKit.disconnect('\(sessionId)')"
        let _ = context.evaluateScript(script)
    }
    
    func getJettons(_ walletAddress: String) async throws -> [[String: Any]] {
        guard let context = jsContext, let instance = walletKitInstance else {
            throw WalletKitError.bridgeError("WalletKit not initialized")
        }
        
        let result = context.evaluateScript("JSON.stringify(window.walletKit.getJettons('\(walletAddress)'))")
        
        if let jsonString = result?.toString(),
           let jsonData = jsonString.data(using: .utf8),
           let jettonsArray = try JSONSerialization.jsonObject(with: jsonData) as? [[String: Any]] {
            return jettonsArray
        }
        
        return []
    }
    
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
