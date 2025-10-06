//
//  TONWalletTransactionRequest.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 02.10.2025.
//

import Foundation

public class TONWalletTransactionRequest {
    let walletKit: any JSDynamicObject
    let event: TransactionRequestEvent
    
    public var dAppInfo: DAppInfo? { event.dAppInfo }
    
    init(
        walletKit: any JSDynamicObject,
        event: TransactionRequestEvent
    ) {
        self.walletKit = walletKit
        self.event = event
    }
    
    public func approve() async throws {
        await try walletKit.approveTransactionRequest(event)
    }
    
    public func reject(reason: String? = nil) async throws {
        await try walletKit.rejectTransactionRequest(event)
    }
}
