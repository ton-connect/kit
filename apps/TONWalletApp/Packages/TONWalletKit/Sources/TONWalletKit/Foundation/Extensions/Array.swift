//
//  Array.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 11.09.2025.
//

import Foundation

extension Array {

    subscript(safe index: Int) -> Element? {
        return indices ~= index ? self[index] : nil
    }
    
    subscript(safe index: UInt) -> Element? {
        return indices ~= Int(index) ? self[Int(index)] : nil
    }
}
