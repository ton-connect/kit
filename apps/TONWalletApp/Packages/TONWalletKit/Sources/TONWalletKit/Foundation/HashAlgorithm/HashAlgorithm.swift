//
//  HashAlgorithm.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 11.09.2025.
//

import Foundation
import CryptoKit
import CommonCrypto

/// Enumeration of supported hash algorithms
enum HashAlgorithm: String, CaseIterable {
    case md5 = "MD5"
    case sha1 = "SHA1"
    case sha224 = "SHA224"
    case sha256 = "SHA256"
    case sha384 = "SHA384"
    case sha512 = "SHA512"
    
    init?(algorithm: String) {
        let value = algorithm.split(separator: "-").joined().uppercased()
        self.init(rawValue: value)
    }
}
