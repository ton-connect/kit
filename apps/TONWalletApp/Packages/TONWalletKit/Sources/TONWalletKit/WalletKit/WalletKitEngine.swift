//
//  WalletKitEngine.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 11.09.2025.
//

import Foundation
import JavaScriptCore

public class WalletKitEngine: JSEngine {
    private let configuration: WalletKitConfig
    private let eventsHandler: any TONBridgeEventsHandler
    
    public private(set) var jsContext: JSContext?
    
    public init(
        configuration: WalletKitConfig,
        eventsHandler: any TONBridgeEventsHandler
    ) {
        self.configuration = configuration
        self.eventsHandler = eventsHandler
    }
    
    public func loadJS(into context: JSContext) async throws {
        let js = try WalletKitJS.load()
        context.evaluateScript(js.code)
    }
    
    public func processJS(in context: JSContext) async throws {
        let bridgePolyfill = JSWalletKitSwiftBridgePolyfill(configuration: configuration) { [weak self] in
            guard let self else { return }
            
            if let walletKitEvent = WalletKitEvent(bridgeEvent: $0, walletKit: self) {
                debugPrint("Event received: \($0)")
                
                self.eventsHandler.handle(event: walletKitEvent)
            }
        }
        
        context.polyfill(with: bridgePolyfill)
        
        if let exception = context.exception {
            throw "JS setup failed: \(exception)"
        }
        
        if context.objectForKeyedSubscript("walletKit") != nil {
            print("✅ WalletKit bridge instance ready")
        } else {
            print("⚠️ WalletKit global not found after initialization")
        }
    }
    
    public func context() -> JSContext {
        if let jsContext {
            return jsContext
        }
        
        let context = JSContext()
        
        context?.exceptionHandler = { context, exception in
            print("❌ JavaScript Exception: \(exception?.toString() ?? "Unknown")")
            if let stackTrace = exception?.objectForKeyedSubscript("stack") {
                print("Stack trace: \(stackTrace)")
            }
        }
        
        context?.polyfill(with: JSConsoleLogPolyfill())
        context?.polyfill(with: JSTimerPolyfill())
        context?.polyfill(with: JSFetchPolyfill())
        
        context?.polyfill(with: JSWalletKitInitialPolyfill())
        
        self.jsContext = context
        
        return context!
    }
    
    public func clearContext() {
        jsContext = nil
    }
}

extension WalletKitEngine: JSDynamicMember {
    
    public subscript(dynamicMember member: String) -> JSFunction {
        if let walletKit = try? object("walletKit") {
            return JSFunction(name: member, target: walletKit)
        }
        fatalError("WalletKitEngine not inited in JS")
    }
}

extension WalletKitEngine: JSDynamicObject {

    public func function(_ name: String) throws -> JSValue? {
        try jsContext?.function(name)
    }
    
    public func object(_ name: String) throws -> JSValue? {
        try jsContext?.object(name)
    }
}

