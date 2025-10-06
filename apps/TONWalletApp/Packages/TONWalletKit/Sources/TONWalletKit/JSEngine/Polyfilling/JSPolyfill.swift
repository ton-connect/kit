//
//  JSPolyfill.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 11.09.2025.
//

import Foundation
import JavaScriptCore

public protocol JSPolyfill: JSExport {
    
    func apply(to context: JSContext)
}

public extension JSContext {
    
    func polyfill(with polyfill: any JSPolyfill) {
        polyfill.apply(to: self)
    }
}
