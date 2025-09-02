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
        
        // Load the compiled WalletKit web app
        if let walletKitURL = loadWalletKitBundle() {
            webView?.loadFileURL(walletKitURL, allowingReadAccessTo: walletKitURL.deletingLastPathComponent())
        } else {
            // Fallback to minimal HTML if bundle not found
            let html = createMinimalHTML()
            webView?.loadHTMLString(html, baseURL: nil)
        }
        
        // Setup completion handling
        setupInitializationCompletion(completion: completion)
    }
    
    private func createWalletKitInitScript() -> String {
        let storageType = storageTypeString(config.storage)
        
        return """
        // WalletKit Swift Bridge - Integration with compiled WalletKit web app
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
            },
            
            // Configuration for WalletKit
            config: {
                network: '\(config.network.rawValue)',
                storage: '\(storageType)',
                manifestUrl: '\(config.manifestUrl)',
                isMobile: true,
                isNative: true
            }
        };
        
        // Console logging - intercept all console methods for bridge communication
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
        
        console.log('🚀 WalletKit Swift Bridge initialized');
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
    
    private func loadWalletKitBundle() -> URL? {
        // Try to find index.html in the dist-js directory
        // First try in dist-js directory, then at root level
        var adapterPath: String? = Bundle.main.path(forResource: "index", ofType: "html", inDirectory: "dist-js")
        
        if adapterPath == nil {
            // Fallback: try at root level (modern Xcode often flattens directory structure)
            adapterPath = Bundle.main.path(forResource: "index", ofType: "html")
        }
        
        guard let finalPath = adapterPath else {
            print("❌ WalletKit: dist-js/index.html not found in app bundle")
            print("📋 Available bundle resources:")
            if let bundlePath = Bundle.main.resourcePath {
                let enumerator = FileManager.default.enumerator(at: URL(fileURLWithPath: bundlePath), 
                                                                includingPropertiesForKeys: nil, 
                                                                options: [.skipsHiddenFiles])
                var count = 0
                while let file = enumerator?.nextObject() as? URL, count < 20 {
                    print("  - \(file.lastPathComponent)")
                    count += 1
                }
                if count >= 20 {
                    print("  ... and more")
                }
            }
            return nil
        }
        
        let adapterURL = URL(fileURLWithPath: finalPath)
        print("✅ WalletKit: Found dist-js/index.html at \(adapterURL.path)")
        
        return adapterURL
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
        
        let wallets = walletsData.compactMap { dict -> WalletInfo? in
            guard let data = try? JSONSerialization.data(withJSONObject: dict),
                  let wallet = try? JSONDecoder().decode(WalletInfo.self, from: data) else {
                return nil
            }
            return wallet
        }
        
        let sessions = sessionsData.compactMap { dict -> SessionInfo? in
            guard let data = try? JSONSerialization.data(withJSONObject: dict),
                  let session = try? JSONDecoder().decode(SessionInfo.self, from: data) else {
                return nil
            }
            return session
        }
        
        return (wallets, sessions)
    }
    
    /// Internal method to get current state without calling JavaScript (to avoid infinite loops)
    private func getCurrentStateInternal() async throws -> ([WalletInfo], [SessionInfo]) {
        print("📋 WalletKit: Getting current state internally")
        
        // For now, return empty arrays as this would normally come from JavaScript storage
        // In a real implementation, you would have a Swift-side storage mechanism
        // or maintain the state in the Swift engine itself
        let wallets: [WalletInfo] = []
        let sessions: [SessionInfo] = []
        
        return (wallets, sessions)
    }
    
    func disconnect(sessionId: String?) async throws {
        if let sessionId = sessionId {
            let _: [String: Any] = try await callJavaScript("disconnect", args: [sessionId])
        } else {
            let _: [String: Any] = try await callJavaScript("disconnect")
        }
    }
    
    /// Internal method to disconnect without calling JavaScript (to avoid infinite loops)
    private func disconnectInternal(sessionId: String?) async throws {
        print("🔌 WalletKit: Disconnecting internally - sessionId: \(sessionId ?? "all")")
        
        // For now, just log the disconnect action
        // In a real implementation, you would handle the disconnection logic here
        // without calling back to JavaScript
        
        // Send disconnect event to notify the UI
        let disconnectEvent: [String: Any] = [
            "sessionId": sessionId ?? "",
            "reason": "User disconnected"
        ]
        
        if let event = parseDisconnectEvent(disconnectEvent) {
            eventSubject.send(.disconnect(event))
        }
    }
    
    func handleTonConnectUrl(_ url: String) async throws {
        print("🔗 WalletKit: Swift calling JavaScript to handle TonConnect URL: \(url)")
        let result: [String: Any] = try await callJavaScript("handleTonConnectUrl", args: [url])
        print("✅ WalletKit: JavaScript returned result: \(result)")
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
        
        let jettons = jettonsData.compactMap { dict -> JettonInfo? in
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
        case "request":
            handleRequestMessage(messageDict)
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
    
    private func handleRequestMessage(_ messageDict: [String: Any]) {
        guard let method = messageDict["method"] as? String,
              let requestId = messageDict["requestId"] as? String else {
            print("❌ WalletKit: Invalid request message format")
            return
        }
        
        let args = messageDict["args"] as? [Any] ?? []
        
        print("🔍 WalletKit: Handling request method: \(method) with args: \(args)")
        
        // Handle JavaScript-to-Swift method calls
        Task {
            await handleJavaScriptRequest(method: method, args: args, requestId: requestId)
        }
    }
    
    private func handleJavaScriptRequest(method: String, args: [Any], requestId: String) async {
        switch method {
        case "test":
            let response: [String: Any] = [
                "message": "WalletKit Swift Bridge is working!",
                "timestamp": Date().timeIntervalSince1970,
                "receivedArgs": args
            ]
            sendJavaScriptResponse(requestId: requestId, success: true, result: response)
            

        case "getCurrentState":
            do {
                // Use internal method to avoid infinite loop (JavaScript -> Swift -> JavaScript)
                let (wallets, sessions) = try await self.getCurrentStateInternal()
                let response: [String: Any] = [
                    "wallets": wallets.map { wallet in
                        // Convert WalletInfo to dictionary
                        [
                            "id": wallet.id,
                            "address": wallet.address,
                            "walletName": wallet.walletName,
                            "network": wallet.network.rawValue,
                            "version": wallet.version,
                            "balance": wallet.balance as Any,
                            "publicKey": wallet.publicKey as Any
                        ]
                    },
                    "sessions": sessions.map { session in
                        // Convert SessionInfo to dictionary
                        [
                            "id": session.id,
                            "sessionId": session.sessionId,
                            "dAppName": session.dAppName,
                            "dAppUrl": session.dAppUrl as Any,
                            "dAppIconUrl": session.dAppIconUrl as Any,
                            "walletAddress": session.walletAddress,
                            "createdAt": session.createdAt.timeIntervalSince1970,
                            "lastActivity": session.lastActivity.timeIntervalSince1970
                        ]
                    }
                ]
                sendJavaScriptResponse(requestId: requestId, success: true, result: response)
            } catch {
                print("❌ WalletKit: Error getting current state: \(error)")
                sendJavaScriptResponse(requestId: requestId, success: false, error: error.localizedDescription)
            }
            
        case "disconnect":
            do {
                let sessionId = args.first as? String
                // Use internal method to avoid infinite loop (JavaScript -> Swift -> JavaScript)
                try await self.disconnectInternal(sessionId: sessionId)
                let response: [String: Any] = [
                    "success": true,
                    "sessionId": sessionId as Any,
                    "message": "Disconnected successfully"
                ]
                sendJavaScriptResponse(requestId: requestId, success: true, result: response)
            } catch {
                print("❌ WalletKit: Error disconnecting: \(error)")
                sendJavaScriptResponse(requestId: requestId, success: false, error: error.localizedDescription)
            }
            
        default:
            print("⚠️ WalletKit: Unknown method: \(method)")
            sendJavaScriptResponse(requestId: requestId, success: false, error: "Method not implemented: \(method)")
        }
    }
    
    private func sendJavaScriptResponse(requestId: String, success: Bool, result: Any? = nil, error: String? = nil) {
        guard let webView = webView else {
            print("❌ WalletKit: Cannot send response - webView is nil")
            return
        }
        
        // Properly escape the error string to prevent JavaScript injection and errors
        let errorString = error?.replacingOccurrences(of: "'", with: "\\'")
            .replacingOccurrences(of: "\"", with: "\\\"")
            .replacingOccurrences(of: "\n", with: "\\n") ?? ""
        
        let script = "window.walletKitSwiftBridge.handleResponse('\(requestId)', \(success), \(encodeJavaScriptValue(result)), '\(errorString)')"
        
        print("🔍 WalletKit: Executing JavaScript response: \(script)")
        
        DispatchQueue.main.async {
            webView.evaluateJavaScript(script) { _, scriptError in
                if let scriptError = scriptError {
                    print("❌ WalletKit: Error sending response: \(scriptError)")
                } else {
                    print("✅ WalletKit: Successfully sent response for request \(requestId)")
                }
            }
        }
    }
    
    private func encodeJavaScriptValue(_ value: Any?) -> String {
        guard let value = value else { return "null" }
        
        do {
            let data = try JSONSerialization.data(withJSONObject: value, options: [])
            guard let string = String(data: data, encoding: .utf8) else {
                return "null"
            }
            return string
        } catch {
            print("❌ WalletKit: Failed to encode value: \(error)")
            return "null"
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
