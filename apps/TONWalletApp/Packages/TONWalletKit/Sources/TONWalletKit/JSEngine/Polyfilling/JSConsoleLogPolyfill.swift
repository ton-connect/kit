//
//  JSConsoleLogPolyfill.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 11.09.2025.
//

import Foundation
import JavaScriptCore

public class JSConsoleLogPolyfill: NSObject, JSPolyfill {
    
    public func apply(to context: JSContext) {
        let consoleLog: @convention(block) (String) -> () = { message in
            self.consoleLog(message)
        }

        let consoleTrace: @convention(block) (JSValue) -> () = { message in
            self.consoleTrace(message.toString() ?? "")
        }
        
        context.setObject(consoleLog, forKeyedSubscript: "nativeLog" as NSString)
        context.setObject(consoleTrace, forKeyedSubscript: "nativeTrace" as NSString)
    }
    
    @objc private func consoleLog(_ message: String) {
        print("[JS Console]: \(message)")
    }

    @objc private func consoleTrace(_ message: String) {
        print("[JS Trace]: \(message)")
    }
}
