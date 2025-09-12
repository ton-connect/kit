//
//  JSEngine.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 11.09.2025.
//

import Foundation
import JavaScriptCore

public protocol JSEngine: JSDynamicObject {
    func loadJS(into context: JSContext) async throws
    func processJS(in context: JSContext) async throws
    
    func context() -> JSContext
    func clearContext()
}

public extension JSEngine {
    
    func start() async throws {
        let context = self.context()
        
        try await loadJS(into: context)
        try await processJS(in: context)
    }
    
    func stop() {
        clearContext()
    }
}
