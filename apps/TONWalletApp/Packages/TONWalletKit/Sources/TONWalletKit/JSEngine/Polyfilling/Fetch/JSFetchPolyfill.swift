//
//  JSFetchPolyfill.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 11.09.2025.
//

import Foundation
import JavaScriptCore

public class JSFetchPolyfill: JSPolyfill {
    
    public func apply(to context: JSContext) {
        do {
            try context.install([.fetch])
        } catch {
            debugPrint("Unable to polyfill fetch function in JS - \(error.localizedDescription)")
        }
    }
}
