//
//  JSWalletKitSwiftBridgePolyfill.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 11.09.2025.
//

import Foundation
import JavaScriptCore

public class JSWalletKitSwiftBridgePolyfill: JSPolyfill {
    private let configuration: WalletKitConfig
    private let eventsHandler: (JSWalletKitSwiftBridgeEvent) -> Void
    
    public init(
        configuration: WalletKitConfig,
        eventsHandler: @escaping (JSWalletKitSwiftBridgeEvent) -> Void
    ) {
        self.configuration = configuration
        self.eventsHandler = eventsHandler
    }
    
    public func apply(to context: JSContext) {
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
                    network: '\(configuration.network.rawValue)',
                    storage: 'memory',
                    manifestUrl: '\(configuration.manifestUrl)',
                    isMobile: true,
                    isNative: true
                },
                sendEvent: sendEventCallback
            };
            
            console.log('✅ Swift bridge configured (events only - Swift calls JS directly)');
        """
        
        context.setObject(sendEventCallback, forKeyedSubscript: "sendEventCallback" as NSString)
        context.evaluateScript(bridgeSetupScript)
    }
    
    private func handleJavaScriptEvent(eventType: String, data: String) {
        print("📨 Native Engine: Received JS event: \(eventType)")
        
        guard let eventType = JSWalletKitSwiftBridgeEventType(rawValue: eventType) else {
            print("⚠️ Unknown event type: \(eventType)")
            return
        }
        
        guard let data = data.data(using: .utf8) else {
            print("❌ Failed to parse event data")
            return
        }
        
        let event = JSWalletKitSwiftBridgeEvent(type: eventType, data: data)
        
        eventsHandler(event)
    }
}

public struct JSWalletKitSwiftBridgeEvent {
    public let type: JSWalletKitSwiftBridgeEventType
    public let data: Data
}

public enum JSWalletKitSwiftBridgeEventType: String {
    case connectRequest
    case transactionRequest
    case signDataRequest
    case disconnect
}
