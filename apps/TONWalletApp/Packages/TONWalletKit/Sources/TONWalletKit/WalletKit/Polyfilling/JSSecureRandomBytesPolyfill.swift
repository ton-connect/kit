//
//  JSSecureRandomBytesPolyfill.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 11.09.2025.
//

import Foundation
import JavaScriptCore

public class JSSecureRandomBytesPolyfill: JSPolyfill {
    
    public func apply(to context: JSContext) {
        let getSecureRandomBytes: @convention(block) (Int) -> JSValue = { [weak context] length in
            guard let context else {
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
        
        context.setObject(getSecureRandomBytes, forKeyedSubscript: "getSecureRandomBytes" as NSString)
    }
    
    @objc
    private func generateSecureRandomBytes(count: Int) throws -> [UInt8] {
        guard count > 0 else {
            throw "Random bytes count must be positive"
        }
        
        var randomBytes = [UInt8](repeating: 0, count: count)
        let result = SecRandomCopyBytes(kSecRandomDefault, count, &randomBytes)
        
        guard result == errSecSuccess else {
            throw "Failed to generate secure random bytes: \(result)"
        }
        
        return randomBytes
    }
}
