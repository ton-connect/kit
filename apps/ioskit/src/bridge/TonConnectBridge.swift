//
//  TonConnectBridge.swift
//  IOSKitDemo
//
//  Created by TonConnect Kit Bridge
//

import Foundation
import WebKit

// JavaScript constants for bridge communication
let BRIDGE_READY = """
window.tonConnectBridge = {
    callNative: function(method, args) {
        return new Promise((resolve, reject) => {
            const requestId = Math.random().toString(36).substring(7);
            window.tonConnectBridge.callbacks = window.tonConnectBridge.callbacks || {};
            window.tonConnectBridge.callbacks[requestId] = { resolve, reject };
            
            window.webkit.messageHandlers.tonConnectBridge.postMessage({
                method: method,
                args: args || [],
                requestId: requestId
            });
        });
    }
};
"""

let BRIDGE_CALLBACK = """
if (window.tonConnectBridge && window.tonConnectBridge.callbacks && window.tonConnectBridge.callbacks['{{requestId}}']) {
    const callback = window.tonConnectBridge.callbacks['{{requestId}}'];
    delete window.tonConnectBridge.callbacks['{{requestId}}'];
    
    if ('{{success}}' === 'true') {
        callback.resolve({{result}});
    } else {
        callback.reject(new Error({{error}}));
    }
}
"""

private let log = print // Simple logging for demo

// Bridge for TonConnect Kit integration
class TonConnectBridge: UIViewController {
    private var webView: WKWebView?
    private var bridgeReady = false
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupWebView()
        view.backgroundColor = UIColor.systemBackground
        navigationItem.title = "TonConnect Demo"
    }
    
    private func setupWebView() {
        let webViewConfiguration = WKWebViewConfiguration()
        let userContentController = WKUserContentController()
        
        // Add message handler for bridge communication
        userContentController.add(self, name: "tonConnectBridge")
        
        // Add console logging for debugging
        let logSource = """
        const originalLog = console.log;
        console.log = function(...args) {
            window.webkit.messageHandlers.consoleLog.postMessage(args.join(' '));
            originalLog.apply(console, args);
        };
        """
        let logScript = WKUserScript(source: logSource, injectionTime: .atDocumentEnd, forMainFrameOnly: false)
        userContentController.addUserScript(logScript)
        userContentController.add(self, name: "consoleLog")
        
        // Inject bridge initialization
        let bridgeScript = WKUserScript(source: BRIDGE_READY, injectionTime: .atDocumentEnd, forMainFrameOnly: false)
        userContentController.addUserScript(bridgeScript)
        
        webViewConfiguration.userContentController = userContentController
        
        // Create WebView
        webView = WKWebView(frame: view.bounds, configuration: webViewConfiguration)
        webView?.navigationDelegate = self
        webView?.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        
        #if DEBUG
        if #available(iOS 16.4, *) {
            webView?.isInspectable = true
        }
        #endif
        
        view.addSubview(webView!)
        loadWebInterface()
    }
    
    private func loadWebInterface() {
        guard let webView = webView else { return }
        
        // Load the bundled HTML file
        if let htmlPath = Bundle.main.path(forResource: "index", ofType: "html") {
            let htmlURL = URL(fileURLWithPath: htmlPath)
            let request = URLRequest(url: htmlURL)
            webView.load(request)
        } else {
            // Fallback: load inline HTML for demo
            let htmlString = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>TonConnect Demo</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                        padding: 20px;
                        margin: 0;
                    }
                    .container {
                        max-width: 400px;
                        margin: 0 auto;
                    }
                    button {
                        background: #007AFF;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        padding: 12px 20px;
                        font-size: 16px;
                        width: 100%;
                        margin: 8px 0;
                        cursor: pointer;
                    }
                    button:active {
                        background: #0051D5;
                    }
                    .status {
                        background: #F2F2F7;
                        border-radius: 8px;
                        padding: 12px;
                        margin: 8px 0;
                        font-family: monospace;
                        font-size: 14px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>TonConnect Demo</h1>
                    <button onclick="testBridge()">Test Bridge</button>
                    <button onclick="connectWallet()">Connect Wallet</button>
                    <button onclick="sendTransaction()">Send Transaction</button>
                    <button onclick="disconnect()">Disconnect</button>
                    <div id="status" class="status">Ready</div>
                </div>
                
                <script>
                async function updateStatus(message) {
                    document.getElementById('status').textContent = message;
                    console.log('Status:', message);
                }
                
                async function testBridge() {
                    try {
                        updateStatus('Testing bridge...');
                        const result = await window.tonConnectBridge.callNative('test', ['Hello from JS']);
                        updateStatus('Bridge test result: ' + JSON.stringify(result));
                    } catch (error) {
                        updateStatus('Bridge test error: ' + error.message);
                    }
                }
                
                async function connectWallet() {
                    try {
                        updateStatus('Connecting wallet...');
                        const result = await window.tonConnectBridge.callNative('connectWallet', []);
                        updateStatus('Wallet connected: ' + JSON.stringify(result));
                    } catch (error) {
                        updateStatus('Connection error: ' + error.message);
                    }
                }
                
                async function sendTransaction() {
                    try {
                        updateStatus('Sending transaction...');
                        const transaction = {
                            to: 'EQD_V9j8p5rQNPx0eK9-2j7J4WROUbm1tFNVzVlzCq-wgmKk',
                            amount: '1000000000', // 1 TON in nanotons
                            memo: 'Test transaction'
                        };
                        const result = await window.tonConnectBridge.callNative('sendTransaction', [transaction]);
                        updateStatus('Transaction sent: ' + JSON.stringify(result));
                    } catch (error) {
                        updateStatus('Transaction error: ' + error.message);
                    }
                }
                
                async function disconnect() {
                    try {
                        updateStatus('Disconnecting...');
                        const result = await window.tonConnectBridge.callNative('disconnect', []);
                        updateStatus('Disconnected: ' + JSON.stringify(result));
                    } catch (error) {
                        updateStatus('Disconnect error: ' + error.message);
                    }
                }
                
                // Initialize when page loads
                window.addEventListener('load', () => {
                    updateStatus('Bridge initialized');
                });
                </script>
            </body>
            </html>
            """
            webView.loadHTMLString(htmlString, baseURL: nil)
        }
    }
    
    private func sendResponse(requestId: String, success: Bool, result: Any? = nil, error: String? = nil) {
        guard let webView = webView else { return }
        
        var script = BRIDGE_CALLBACK
        script = script.replacingOccurrences(of: "{{requestId}}", with: requestId)
        script = script.replacingOccurrences(of: "{{success}}", with: success ? "true" : "false")
        
        if success {
            let resultJSON = result != nil ? jsonString(from: result!) : "null"
            script = script.replacingOccurrences(of: "{{result}}", with: resultJSON)
            script = script.replacingOccurrences(of: "{{error}}", with: "null")
        } else {
            script = script.replacingOccurrences(of: "{{result}}", with: "null")
            let errorJSON = jsonString(from: error ?? "Unknown error")
            script = script.replacingOccurrences(of: "{{error}}", with: errorJSON)
        }
        
        DispatchQueue.main.async {
            webView.evaluateJavaScript(script) { _, error in
                if let error = error {
                    log("Error sending response: \(error)")
                }
            }
        }
    }
    
    private func jsonString(from object: Any) -> String {
        guard let data = try? JSONSerialization.data(withJSONObject: object, options: []),
              let string = String(data: data, encoding: .utf8) else {
            return "null"
        }
        return string
    }
}

// MARK: - WKScriptMessageHandler
extension TonConnectBridge: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        switch message.name {
        case "tonConnectBridge":
            handleBridgeMessage(message.body)
        case "consoleLog":
            log("JS Console: \(message.body)")
        default:
            break
        }
    }
    
    private func handleBridgeMessage(_ body: Any) {
        guard let messageDict = body as? [String: Any],
              let method = messageDict["method"] as? String,
              let requestId = messageDict["requestId"] as? String else {
            log("Invalid bridge message format")
            return
        }
        
        let args = messageDict["args"] as? [Any] ?? []
        
        log("Bridge call: \(method) with args: \(args)")
        
        // Handle different methods
        switch method {
        case "test":
            // Simple test method
            let response = [
                "message": "Bridge is working!",
                "timestamp": Date().timeIntervalSince1970,
                "receivedArgs": args
            ]
            sendResponse(requestId: requestId, success: true, result: response)
            
        case "connectWallet":
            // Mock wallet connection
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
                let walletInfo = [
                    "address": "EQD_V9j8p5rQNPx0eK9-2j7J4WRUbm1tFNVzVlzCq-wgmKk",
                    "chain": -239,
                    "walletName": "Demo Wallet",
                    "publicKey": "demo_public_key_123"
                ]
                self?.sendResponse(requestId: requestId, success: true, result: walletInfo)
            }
            
        case "sendTransaction":
            // Mock transaction sending
            guard let transactionArgs = args.first as? [String: Any] else {
                sendResponse(requestId: requestId, success: false, error: "Invalid transaction arguments")
                return
            }
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) { [weak self] in
                let result = [
                    "hash": "demo_transaction_hash_\(UUID().uuidString)",
                    "timestamp": Date().timeIntervalSince1970,
                    "transaction": transactionArgs
                ]
                self?.sendResponse(requestId: requestId, success: true, result: result)
            }
            
        case "disconnect":
            // Mock disconnection
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
                let result = ["disconnected": true]
                self?.sendResponse(requestId: requestId, success: true, result: result)
            }
            
        default:
            sendResponse(requestId: requestId, success: false, error: "Unknown method: \(method)")
        }
    }
}

// MARK: - WKNavigationDelegate
extension TonConnectBridge: WKNavigationDelegate {
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        bridgeReady = true
        log("WebView loaded successfully")
    }
    
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        log("WebView failed to load: \(error)")
    }
}

