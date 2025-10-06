//
//  String.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 11.09.2025.
//

import Foundation

extension String: @retroactive LocalizedError {
    
    public var errorDescription: String? { self }
}
