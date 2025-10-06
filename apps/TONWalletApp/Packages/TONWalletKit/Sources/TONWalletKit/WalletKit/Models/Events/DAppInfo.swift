//
//  DAppInfo.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 03.10.2025.
//

import Foundation

public struct DAppInfo: Codable {
    public let name: String?
    public let description: String?
    public let url: URL?
    public let iconUrl: URL?
}
