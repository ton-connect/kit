//
//  TONMnemonic.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 12.09.2025.
//

public struct TONMnemonic {
    public private(set) var value: [String]
    
    public var isFilled: Bool {
        value.prefix(TONMnemonicLenght.bits128.rawValue).allSatisfy { !$0.isEmpty }
    }
    
    public init() {
        value = Array(repeating: "", count: TONMnemonicLenght.bits256.rawValue)
    }
    
    public init(value: [String]) {
        let count = TONMnemonicLenght.bits256.rawValue
        let diff = max(0, count - value.count)
        let normalizedValue = value.prefix(TONMnemonicLenght.bits256.rawValue).map { $0 }
        self.value = normalizedValue + Array(repeating: "", count: diff)
    }
    
    public init(string: String) {
        self = Self.init(value: string.components(separatedBy: " "))
    }
    
    public mutating func update(word: String, at index: Int) {
        if value.indices ~= index {
            value[index] = word
        }
    }
}

public enum TONMnemonicLenght: Int {
    case bits128 = 12
    case bits256 = 24
}
