//
//  JSPBKDF2Polyfill.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 11.09.2025.
//

import Foundation
import JavaScriptCore
import CommonCrypto

public class JSPBKDF2Polyfill: JSPolyfill {
    
    public func apply(to context: JSContext) {
        let pbkdf2Derive: @convention(block) (
            String,
            String,
            Int,
            Int,
            String
        ) -> JSValue = { [weak context] password, salt, iterations, keySize, hash in
            guard let context else {
                return JSValue(undefinedIn: context)
            }
            
            do {
                let derivedKey = try self.derivePBKDF2(
                    password: password,
                    salt: salt,
                    iterations: iterations,
                    keySize: keySize,
                    hash: hash
                )
                return JSValue(object: derivedKey, in: context)
            } catch {
                print("❌ PBKDF2 derivation failed: \(error)")
                return JSValue(undefinedIn: context)
            }
        }
        context.setObject(pbkdf2Derive, forKeyedSubscript: "nativePbkdf2Derive" as NSString)
    }
    
    @objc
    private func derivePBKDF2(
        password: String,
        salt: String,
        iterations: Int,
        keySize: Int,
        hash: String
    ) throws -> String {
        guard let passwordData = Data(base64Encoded: password),
              let saltData = Data(base64Encoded: salt) else {
            throw "Failed to convert password or salt to data"
        }
        
        guard let algorithm = HashAlgorithm(algorithm: hash)?.pbkdf2PseudoRandomAlgorithm else {
            throw "Unsupported hash algorithm: \(hash)"
        }
        
        var derivedKey = Data(count: keySize)
        
        let result = derivedKey.withUnsafeMutableBytes { derivedKeyBytes in
            passwordData.withUnsafeBytes { passwordBytes in
                saltData.withUnsafeBytes { saltBytes in
                    CCKeyDerivationPBKDF(
                        CCPBKDFAlgorithm(kCCPBKDF2),
                        passwordBytes.bindMemory(to: Int8.self).baseAddress, passwordData.count,
                        saltBytes.bindMemory(to: UInt8.self).baseAddress, saltData.count,
                        algorithm,
                        UInt32(iterations),
                        derivedKeyBytes.bindMemory(to: UInt8.self).baseAddress, keySize
                    )
                }
            }
        }
        
        guard result == kCCSuccess else {
            throw "PBKDF2 derivation failed with error: \(result)"
        }
        return derivedKey.map { String(format: "%02x", $0) }.joined()
    }
}

private extension HashAlgorithm {
    
    var pbkdf2PseudoRandomAlgorithm: CCPseudoRandomAlgorithm? {
        switch self {
        case .sha1: CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA1)
        case .sha256: CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA256)
        case .sha512: CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA512)
        default: nil
        }
    }
}
