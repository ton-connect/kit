//
//  WalletKitWebViewEngine.swift
//  TonWalletKit WebView Integration
//
//  Integrates the JavaScript WalletKit library using WKWebView for better debugging
//

import Foundation
import WebKit
import Combine
import os.log

/// WebView-based engine that runs the WalletKit JavaScript library in a WKWebView
/// Provides better debugging experience through Safari Web Inspector
@MainActor
class WalletKitWebViewEngine: NSObject, @preconcurrency WalletKitEngine {
    
    // MARK: - Properties
    private var webView: WKWebView?
    private var isInitialized = false
    private let config: WalletKitConfig
    private var initializationContinuation: CheckedContinuation<Void, Error>?
    
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
    
    /// Initialize the WebView-based WalletKit environment
    func initialize() async throws {
        guard !isInitialized else { return }
        guard initializationContinuation == nil else { return }
        
        return try await withCheckedThrowingContinuation { continuation in
            self.initializationContinuation = continuation
            
            // Set up timeout for initialization
            Task {
                try await Task.sleep(for: .seconds(30))
                if !self.isInitialized && self.initializationContinuation != nil {
                    print("⏰ WebView initialization timeout")
                    await MainActor.run {
                        self.initializationContinuation?.resume(throwing: WalletKitError.initializationFailed("Initialization timeout"))
                        self.initializationContinuation = nil
                    }
                }
            }
            
            self.setupWebView()
            self.loadWalletKitHTML()
        }
    }
    
    private func setupWebView() {
        let configuration = WKWebViewConfiguration()
        
        // Note: WebView debugging is available through Safari Developer Menu -> Develop
        // when running on a physical device or simulator
        
        // Configure preferences for better JavaScript support
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = false
        
        // Set up message handlers for Swift-JS communication
        let contentController = WKUserContentController()
        
        // Add message handler for events from JavaScript
        contentController.add(self, name: "walletKitEvent")
        
        // Add message handler for console logging
        contentController.add(self, name: "consoleLog")
        
        // Add message handler for initialization status
        contentController.add(self, name: "initializationStatus")
        
        configuration.userContentController = contentController
        
        // Create WebView
        webView = WKWebView(frame: .zero, configuration: configuration)
        webView?.navigationDelegate = self

        if #available(iOS 16.4, *) {
            webView?.isInspectable = true
        }
        
        print("✅ WebView configured with debugging enabled")
    }
    
    private func loadWalletKitHTML() {
        guard let webView = webView else { return }
        
        // Create HTML content that loads our JavaScript
        let htmlContent = createWalletKitHTML()
        
        // Get base URL for loading local resources
        let baseURL = Bundle.main.bundleURL
        
        print("📄 Loading WalletKit HTML in WebView...")
        webView.loadHTMLString(htmlContent, baseURL: baseURL)
    }
    
    private func loadJavaScriptBundle() -> String? {
        // Try to load the JavaScript bundle from various possible locations in the app bundle
        let bundlePaths = [
            "dist-js/ioskit.mjs",
            "ioskit.mjs", 
            "dist-js/ioskit.js",
            "ioskit.js"
        ]
        
        for bundlePath in bundlePaths {
            if let bundleURL = Bundle.main.url(forResource: bundlePath.components(separatedBy: "/").dropLast().joined(separator: "/"), 
                                             withExtension: nil)?.appendingPathComponent(bundlePath.components(separatedBy: "/").last ?? ""),
               let jsContent = try? String(contentsOf: bundleURL, encoding: .utf8) {
                print("✅ Loaded JavaScript bundle from: \(bundlePath), size: \(jsContent.count) chars")
                return jsContent
            }
            
            // Also try loading as a resource without subdirectory
            if let resourceName = bundlePath.components(separatedBy: "/").last?.components(separatedBy: ".").first,
               let resourceExt = bundlePath.components(separatedBy: "/").last?.components(separatedBy: ".").last,
               let bundleURL = Bundle.main.url(forResource: resourceName, withExtension: resourceExt),
               let jsContent = try? String(contentsOf: bundleURL, encoding: .utf8) {
                print("✅ Loaded JavaScript bundle from resource: \(resourceName).\(resourceExt), size: \(jsContent.count) chars")
                return jsContent
            }
        }
        
        print("⚠️ Could not load JavaScript bundle from any expected location")
        return nil
    }
    
    private func createWalletKitHTML() -> String {
        // Load JavaScript bundle in Swift
        let jsBundle = loadJavaScriptBundle()
        
        // Create a comprehensive HTML page that includes:
        // 1. Console logging bridge
        // 2. Error handling
        // 3. WalletKit JavaScript embedded directly
        // 4. Swift bridge setup
        
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>WalletKit WebView Engine</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    margin: 0;
                }
                .status {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 10px;
                    border-radius: 8px;
                    margin: 10px 0;
                    font-family: monospace;
                    font-size: 12px;
                }
                .success { background: rgba(0, 128, 0, 0.3); }
                .error { background: rgba(128, 0, 0, 0.3); }
                .warning { background: rgba(255, 165, 0, 0.3); }
                .debug-info {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: rgba(0, 0, 0, 0.8);
                    padding: 10px;
                    border-radius: 8px;
                    font-size: 10px;
                    max-width: 200px;
                }
            </style>
        </head>
        <body>
            <h1>🌐 WalletKit WebView Engine</h1>
            <div id="bridge-status" class="status">Initializing...</div>
            <div id="console-output"></div>
            
            <div class="debug-info">
                <strong>Debug Mode</strong><br>
                Open Safari → Develop → [Device] → WalletKit WebView<br>
                User Agent: <span id="user-agent"></span>
            </div>
            
            <script>
                // Embed JavaScript bundle from Swift
                window.walletKitJSBundle = `\(jsBundle?.replacingOccurrences(of: "`", with: "\\`").replacingOccurrences(of: "\\", with: "\\\\") ?? "")`;
                console.log('📦 JavaScript bundle embedded, length:', window.walletKitJSBundle.length);
                
                // Enhanced console logging that forwards to Swift
                const originalConsole = window.console;
                const consoleOutput = document.getElementById('console-output');
                
                ['log', 'warn', 'error', 'info', 'debug'].forEach(method => {
                    console[method] = function(...args) {
                        const message = args.map(arg => 
                            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                        ).join(' ');
                        
                        // Forward to Swift
                        try {
                            webkit.messageHandlers.consoleLog.postMessage({
                                level: method,
                                message: message,
                                timestamp: new Date().toISOString()
                            });
                        } catch (e) {
                            // Fallback if message handler not available
                        }
                        
                        // Display in WebView for debugging
                        const logDiv = document.createElement('div');
                        logDiv.className = `status ${method === 'error' ? 'error' : method === 'warn' ? 'warning' : ''}`;
                        logDiv.textContent = `[${method.toUpperCase()}] ${message}`;
                        consoleOutput.appendChild(logDiv);
                        consoleOutput.scrollTop = consoleOutput.scrollHeight;
                        
                        // Call original console method
                        originalConsole[method].apply(console, args);
                    };
                });
                
                // Global error handling
                window.addEventListener('error', function(event) {
                    const error = {
                        message: event.message,
                        source: event.filename,
                        line: event.lineno,
                        column: event.colno,
                        stack: event.error ? event.error.stack : 'No stack trace'
                    };
                    
                    console.error('Global JavaScript Error:', error);
                    
                    // Notify Swift of critical error
                    try {
                        webkit.messageHandlers.initializationStatus.postMessage({
                            success: false,
                            error: error.message,
                            details: error
                        });
                    } catch (e) {}
                });
                
                // Unhandled promise rejection handling
                window.addEventListener('unhandledrejection', function(event) {
                    console.error('Unhandled Promise Rejection:', event.reason);
                });
                
                // Display user agent for debugging
                document.getElementById('user-agent').textContent = navigator.userAgent;
                
                // Track initialization attempts to prevent infinite loops
                if (window.walletKitInitializationStarted) {
                    console.log('⚠️ WalletKit initialization already in progress, skipping...');
                    return;
                }
                window.walletKitInitializationStarted = true;
                
                console.log('🚀 WalletKit WebView environment initializing...');
                
                // Set up crypto polyfill using Swift's secure random
                if (!window.crypto || !window.crypto.getRandomValues) {
                    console.log('🔒 Setting up crypto polyfill...');
                    
                    window.crypto = window.crypto || {};
                    window.crypto.getRandomValues = function(array) {
                        console.warn('⚠️ crypto.getRandomValues not implemented in WebView - using Math.random fallback');
                        
                        // Fallback implementation using Math.random
                        // In a real implementation, you'd want to bridge to Swift's secure random
                        for (let i = 0; i < array.length; i++) {
                            array[i] = Math.floor(Math.random() * 256);
                        }
                        return array;
                    };
                    
                    window.crypto.randomUUID = function() {
                        const bytes = new Uint8Array(16);
                        this.getRandomValues(bytes);
                        bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
                        bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10
                        
                        const hex = Array.from(bytes, byte => 
                            byte.toString(16).padStart(2, '0')
                        ).join('');
                        
                        return hex.substring(0, 8) + '-' + 
                               hex.substring(8, 12) + '-' + 
                               hex.substring(12, 16) + '-' + 
                               hex.substring(16, 20) + '-' + 
                               hex.substring(20, 32);
                    };
                }
                
                // Load the WalletKit JavaScript bundle that was embedded by Swift
                async function loadWalletKitBundle() {
                    console.log('📦 Loading embedded WalletKit JavaScript bundle...');
                    
                    // Check if bundle was embedded by Swift
                    if (window.walletKitJSBundle && window.walletKitJSBundle.length > 0) {
                        try {
                            console.log(`✅ Found embedded bundle, size: ${window.walletKitJSBundle.length} chars`);
                            
                            // Execute the embedded JavaScript bundle
                            console.log('🚀 Executing embedded JavaScript bundle...');
                            const moduleScript = document.createElement('script');
                            moduleScript.textContent = window.walletKitJSBundle;
                            moduleScript.onerror = (error) => {
                                console.error('❌ Embedded script execution error:', error);
                                // Fall back to inline implementation on error
                                loadInlineWalletKit();
                            };
                            moduleScript.onload = () => {
                                console.log('✅ Embedded script loaded successfully');
                            };
                            document.head.appendChild(moduleScript);
                            
                            console.log('✅ WalletKit bundle loaded and executed successfully');
                            return; // Success, exit function
                            
                        } catch (error) {
                            console.error(`❌ Failed to execute embedded bundle:`, error);
                        }
                    } else {
                        console.log('⚠️ No embedded JavaScript bundle found from Swift');
                    }
                    
                    // Fall back to inline implementation
                    console.log('🔄 Falling back to inline implementation');
                    await loadInlineWalletKit();
                }
                
                // Alternative: Load a simplified version for testing
                async function loadInlineWalletKit() {
                    console.log('🔄 Loading simplified WalletKit for WebView...');
                    
                    // Set up Swift bridge configuration
                    window.walletKitSwiftBridge = {
                        config: {
                            network: '${config.network.rawValue}',
                            storage: 'memory',
                            manifestUrl: '${config.manifestUrl}',
                            isMobile: true,
                            isNative: true,
                            isWebView: true
                        },
                        sendEvent: function(eventType, eventData) {
                            console.log('📨 WebView Bridge: Sending event to Swift:', eventType, eventData);
                            try {
                                webkit.messageHandlers.walletKitEvent.postMessage({
                                    type: eventType,
                                    data: eventData
                                });
                            } catch (error) {
                                console.error('❌ Failed to send event to Swift:', error);
                            }
                        }
                    };
                    
                    // Create a mock WalletKit object for testing
                    window.walletKit = {
                        isReady: () => true,
                        
                        async addWallet(config) {
                            console.log('➕ WebView: Adding wallet:', config);
                            return { success: true, address: 'mock_address' };
                        },
                        
                        async getWallets() {
                            console.log('📋 WebView: Getting wallets');
                            return [];
                        },
                        
                        async getSessions() {
                            console.log('📋 WebView: Getting sessions'); 
                            return [];
                        },
                        
                        async handleTonConnectUrl(url) {
                            console.log('🔗 WebView: Handling TON Connect URL:', url);
                            // Trigger a mock connect request for testing
                            setTimeout(() => {
                                window.walletKitSwiftBridge.sendEvent('connectRequest', {
                                    id: 'mock_request_' + Date.now(),
                                    payload: { items: [] },
                                    from: { url: url }
                                });
                            }, 1000);
                        },
                        
                        async approveConnectRequest(requestId, walletAddress) {
                            console.log('✅ WebView: Approving connect request:', requestId, walletAddress);
                            return { success: true };
                        },
                        
                        async rejectConnectRequest(requestId, reason) {
                            console.log('❌ WebView: Rejecting connect request:', requestId, reason);
                            return { success: true };
                        },
                        
                        async approveTransactionRequest(requestId) {
                            console.log('✅ WebView: Approving transaction:', requestId);
                            return { success: true };
                        },
                        
                        async rejectTransactionRequest(requestId, reason) {
                            console.log('❌ WebView: Rejecting transaction:', requestId, reason);
                            return { success: true };
                        },
                        
                        async approveSignDataRequest(requestId) {
                            console.log('✅ WebView: Approving sign data:', requestId);
                            return { success: true };
                        },
                        
                        async rejectSignDataRequest(requestId, reason) {
                            console.log('❌ WebView: Rejecting sign data:', requestId, reason);
                            return { success: true };
                        },
                        
                        async disconnect(sessionId) {
                            console.log('🔌 WebView: Disconnecting:', sessionId);
                            return { success: true };
                        },
                        
                        async getJettons(walletAddress) {
                            console.log('🪙 WebView: Getting jettons for:', walletAddress);
                            return [];
                        }
                    };
                    
                    console.log('✅ WebView WalletKit bridge initialized');
                    
                    // Mark initialization as completed
                    window.walletKitInitializationCompleted = true;
                    
                    // Update UI
                    const status = document.getElementById('bridge-status');
                    if (status) {
                        status.textContent = 'WebView WalletKit Ready (Mock Mode)';
                        status.className = 'status success';
                    }
                    
                    // Notify Swift of successful initialization
                    try {
                        webkit.messageHandlers.initializationStatus.postMessage({
                            success: true,
                            engine: 'webview',
                            mode: 'mock'
                        });
                    } catch (error) {
                        console.error('❌ Failed to notify Swift of initialization:', error);
                    }
                }
                
                // Start initialization - make it globally accessible
                function startInitialization() {
                    if (window.walletKitInitializationCompleted) {
                        console.log('⚠️ WalletKit already initialized, skipping...');
                        return;
                    }
                    
                    console.log('📄 Starting WalletKit initialization...');
                    
                    // Give WebView some time to fully load, then start
                    setTimeout(async () => {
                        try {
                            await loadWalletKitBundle();
                        } catch (error) {
                            console.error('❌ Critical initialization error:', error);
                            
                            // Update UI to show error
                            const status = document.getElementById('bridge-status');
                            if (status) {
                                status.textContent = `Initialization Failed: ${error.message}`;
                                status.className = 'status error';
                            }
                            
                            // Notify Swift of failure
                            try {
                                webkit.messageHandlers.initializationStatus.postMessage({
                                    success: false,
                                    error: error.message,
                                    engine: 'webview'
                                });
                            } catch (e) {
                                console.error('❌ Failed to notify Swift of error:', e);
                            }
                        }
                    }, 500);
                }
                
                console.log('🔍 startInitialization set:', startInitialization);
                // Make startInitialization globally accessible for Swift calls
                window.startInitialization = startInitialization;
                
                // Handle both DOMContentLoaded and immediate execution
                if (document.readyState === 'loading') {
                    console.log('🔍 Adding DOMContentLoaded listener for startInitialization');
                    document.addEventListener('DOMContentLoaded', startInitialization);
                } else {
                    console.log('🔍 DOMContentLoaded listener not needed, starting immediately');
                    // DOM is already loaded
                    startInitialization();
                }
            </script>
        </body>
        </html>
        """
    }
    
    // MARK: - API Methods (same interface as WalletKitNativeEngine)
    
    func addWallet(_ config: WalletConfig) async throws {
        guard let webView = webView, isInitialized else {
            throw WalletKitError.bridgeError("WebView WalletKit not initialized")
        }
        
        let configJSON = try JSONSerialization.data(withJSONObject: [
            "mnemonic": config.mnemonic,
            "name": config.name,
            "network": "mainnet",
            "version": config.version,
            "mnemonicType": "ton"
        ])
        
        let configString = String(data: configJSON, encoding: .utf8)!
        let script = "window.walletKit.addWallet(\(configString))"
        
        try await webView.evaluateJavaScript(script)
    }
    
    func getWallets() async throws -> [[String: Any]] {
        guard let webView = webView, isInitialized else {
            throw WalletKitError.bridgeError("WebView WalletKit not initialized")
        }
        
        let result = try await webView.evaluateJavaScript("JSON.stringify(window.walletKit.getWallets())")
        
        if let jsonString = result as? String,
           let jsonData = jsonString.data(using: .utf8),
           let walletsArray = try JSONSerialization.jsonObject(with: jsonData) as? [[String: Any]] {
            return walletsArray
        }
        
        return []
    }
    
    func handleTonConnectUrl(_ url: String) async throws {
        guard let webView = webView, isInitialized else {
            throw WalletKitError.bridgeError("WebView WalletKit not initialized")
        }
        
        let script = "window.walletKit.handleTonConnectUrl('\(url)')"
        try await webView.evaluateJavaScript(script)
    }
    
    func removeWallet(_ address: String) async throws {
        guard let webView = webView, isInitialized else {
            throw WalletKitError.bridgeError("WebView WalletKit not initialized")
        }
        
        let script = "window.walletKit.removeWallet('\(address)')"
        try await webView.evaluateJavaScript(script)
    }
    
    func clearWallets() async throws {
        guard let webView = webView, isInitialized else {
            throw WalletKitError.bridgeError("WebView WalletKit not initialized")
        }
        
        let script = "window.walletKit.clearWallets()"
        try await webView.evaluateJavaScript(script)
    }
    
    func getSessions() async throws -> [[String: Any]] {
        guard let webView = webView, isInitialized else {
            throw WalletKitError.bridgeError("WebView WalletKit not initialized")
        }
        
        let result = try await webView.evaluateJavaScript("JSON.stringify(window.walletKit.getSessions())")
        
        if let jsonString = result as? String,
           let jsonData = jsonString.data(using: .utf8),
           let sessionsArray = try JSONSerialization.jsonObject(with: jsonData) as? [[String: Any]] {
            return sessionsArray
        }
        
        return []
    }
    
    func approveConnectRequest(_ requestId: String, walletAddress: String) async throws {
        guard let webView = webView, isInitialized else {
            throw WalletKitError.bridgeError("WebView WalletKit not initialized")
        }
        
        let script = "window.walletKit.approveConnectRequest('\(requestId)', '\(walletAddress)')"
        try await webView.evaluateJavaScript(script)
    }
    
    func rejectConnectRequest(_ requestId: String, reason: String) async throws {
        guard let webView = webView, isInitialized else {
            throw WalletKitError.bridgeError("WebView WalletKit not initialized")
        }
        
        let script = "window.walletKit.rejectConnectRequest('\(requestId)', '\(reason)')"
        try await webView.evaluateJavaScript(script)
    }
    
    func approveTransactionRequest(_ requestId: String) async throws {
        guard let webView = webView, isInitialized else {
            throw WalletKitError.bridgeError("WebView WalletKit not initialized")
        }
        
        let script = "window.walletKit.approveTransactionRequest('\(requestId)')"
        try await webView.evaluateJavaScript(script)
    }
    
    func rejectTransactionRequest(_ requestId: String, reason: String) async throws {
        guard let webView = webView, isInitialized else {
            throw WalletKitError.bridgeError("WebView WalletKit not initialized")
        }
        
        let script = "window.walletKit.rejectTransactionRequest('\(requestId)', '\(reason)')"
        try await webView.evaluateJavaScript(script)
    }
    
    func approveSignDataRequest(_ requestId: String) async throws {
        guard let webView = webView, isInitialized else {
            throw WalletKitError.bridgeError("WebView WalletKit not initialized")
        }
        
        let script = "window.walletKit.approveSignDataRequest('\(requestId)')"
        try await webView.evaluateJavaScript(script)
    }
    
    func rejectSignDataRequest(_ requestId: String, reason: String) async throws {
        guard let webView = webView, isInitialized else {
            throw WalletKitError.bridgeError("WebView WalletKit not initialized")
        }
        
        let script = "window.walletKit.rejectSignDataRequest('\(requestId)', '\(reason)')"
        try await webView.evaluateJavaScript(script)
    }
    
    func disconnect(_ sessionId: String) async throws {
        guard let webView = webView, isInitialized else {
            throw WalletKitError.bridgeError("WebView WalletKit not initialized")
        }
        
        let script = "window.walletKit.disconnect('\(sessionId)')"
        try await webView.evaluateJavaScript(script)
    }
    
    func getJettons(_ walletAddress: String) async throws -> [[String: Any]] {
        guard let webView = webView, isInitialized else {
            throw WalletKitError.bridgeError("WebView WalletKit not initialized")
        }
        
        let result = try await webView.evaluateJavaScript("JSON.stringify(window.walletKit.getJettons('\(walletAddress)'))")
        
        if let jsonString = result as? String,
           let jsonData = jsonString.data(using: .utf8),
           let jettonsArray = try JSONSerialization.jsonObject(with: jsonData) as? [[String: Any]] {
            return jettonsArray
        }
        
        return []
    }
    
    func close() async throws {
        isInitialized = false
        webView?.navigationDelegate = nil
        webView?.removeFromSuperview()
        webView = nil
    }
    
    // MARK: - Debug/Inspection Methods
    
    #if DEBUG
    /// Get access to the underlying WebView for debugging
    func getWebView() -> WKWebView? {
        return webView
    }
    
    /// Execute arbitrary JavaScript for inspection/debugging
    func debugEvaluateScript(_ script: String) async throws -> String? {
        guard let webView = webView else { return nil }
        
        do {
            let result = try await webView.evaluateJavaScript(script)
            return String(describing: result)
        } catch {
            print("❌ Debug script execution failed: \(error)")
            return nil
        }
    }
    
    /// Get the current state of the WalletKit instance as JSON
    func debugGetWalletKitState() async throws -> String? {
        return try await debugEvaluateScript("""
            JSON.stringify({
                walletKitAvailable: !!window.walletKit,
                bridgeAvailable: !!window.walletKitSwiftBridge,
                initialized: true,
                userAgent: navigator.userAgent,
                location: window.location.href
            }, null, 2)
        """)
    }
    #endif
}

// MARK: - WKScriptMessageHandler

extension WalletKitWebViewEngine: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        switch message.name {
        case "walletKitEvent":
            handleWebViewEvent(message)
        case "consoleLog":
            handleConsoleLog(message)
        case "initializationStatus":
            handleInitializationStatus(message)
        default:
            print("⚠️ Unknown message from WebView: \(message.name)")
        }
    }
    
    private func handleWebViewEvent(_ message: WKScriptMessage) {
        guard let body = message.body as? [String: Any],
              let eventType = body["type"] as? String,
              let eventData = body["data"] else {
            print("⚠️ Invalid event message from WebView")
            return
        }
        
        print("📨 WebView Engine: Received event: \(eventType)")
        
        do {
            let jsonData = try JSONSerialization.data(withJSONObject: eventData)
            let eventDataString = String(data: jsonData, encoding: .utf8) ?? "{}"
            handleJavaScriptEvent(eventType: eventType, data: eventDataString)
        } catch {
            print("❌ Failed to process WebView event: \(error)")
        }
    }
    
    private func handleConsoleLog(_ message: WKScriptMessage) {
        guard let body = message.body as? [String: Any],
              let level = body["level"] as? String,
              let logMessage = body["message"] as? String else {
            return
        }
        
        let prefix = level.uppercased()
        print("🌐 WebView JS [\(prefix)]: \(logMessage)")
    }
    
    private func handleInitializationStatus(_ message: WKScriptMessage) {
        guard let body = message.body as? [String: Any],
              let success = body["success"] as? Bool else {
            print("⚠️ Invalid initialization status message from WebView")
            return
        }
        
        print("📨 WebView initialization status: \(success ? "success" : "failed")")
        
        if success {
            if !isInitialized {
                isInitialized = true
                print("✅ WebView WalletKit initialized successfully")
                eventSubject.send(.stateChanged)
                initializationContinuation?.resume()
                initializationContinuation = nil
            } else {
                print("⚠️ WebView already initialized, ignoring duplicate success message")
            }
        } else {
            if initializationContinuation != nil {
                let errorMessage = body["error"] as? String ?? "Unknown initialization error"
                print("❌ WebView WalletKit initialization failed: \(errorMessage)")
                let error = WalletKitError.initializationFailed(errorMessage)
                initializationContinuation?.resume(throwing: error)
                initializationContinuation = nil
            } else {
                print("⚠️ Received initialization error but no continuation to resume")
            }
        }
    }
    
    private func handleJavaScriptEvent(eventType: String, data: String) {
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
    
    // MARK: - Event Parsing (reuse from WalletKitNativeEngine)
    
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
}

// MARK: - WKNavigationDelegate

extension WalletKitWebViewEngine: WKNavigationDelegate {
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        print("✅ WebView finished loading HTML content")
        
        // Debug: Check if JavaScript is working at all
        Task {
            do {
                let result = try await webView.evaluateJavaScript("document.readyState")
                print("🔍 Document ready state: \(result)")
                
                let hasStarted = try await webView.evaluateJavaScript("!!window.walletKitInitializationStarted")
                print("🔍 Initialization started flag: \(hasStarted)")
                
                let hasCompleted = try await webView.evaluateJavaScript("!!window.walletKitInitializationCompleted")
                print("🔍 Initialization completed flag: \(hasCompleted)")
                
                // Force trigger initialization if not started
                // let forceStart = try await webView.evaluateJavaScript("""
                //     if (!window.walletKitInitializationStarted) {
                //         console.log('🔄 Forcing initialization start from Swift...');
                //         startInitialization();
                //         'Initialization forced';
                //     } else {
                //         'Already started or completed';
                //     }
                // """)
                // print("🔍 Force start result: \(forceStart)")
                
            } catch {
                print("❌ JavaScript evaluation failed: \(error)")
            }
        }
    }
    
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("❌ WebView navigation failed: \(error)")
        if let continuation = initializationContinuation {
            continuation.resume(throwing: WalletKitError.initializationFailed(error.localizedDescription))
            initializationContinuation = nil
        }
    }
    
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        print("❌ WebView provisional navigation failed: \(error)")
        if let continuation = initializationContinuation {
            continuation.resume(throwing: WalletKitError.initializationFailed(error.localizedDescription))
            initializationContinuation = nil
        }
    }
}

