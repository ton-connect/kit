//
//  JSValue.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 30.09.2025.
//

extension JSValue {
    
    func toData() -> Data? {
        if isString {
            return toString().data(using: .utf8)
        }
        
        if isObject, let dictionary = toDictionary() {
            return try? JSONSerialization.data(withJSONObject: dictionary)
        }
        
        return nil
    }
}
