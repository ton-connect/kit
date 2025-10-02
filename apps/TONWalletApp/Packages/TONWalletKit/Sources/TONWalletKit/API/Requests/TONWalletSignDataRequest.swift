//
//  TONWalletSignDataRequest.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 02.10.2025.
//

import Foundation

public class TONWalletSignDataRequest {
    let walletKit: any JSDynamicObject
    let event: SignDataRequestEvent
    
    init(
        walletKit: any JSDynamicObject,
        event: SignDataRequestEvent
    ) {
        self.walletKit = walletKit
        self.event = event
    }
    
    public func approve() async throws {
        await walletKit.approveSignDataRequest(event)?.then()
    }
    
    public func reject(reason: String? = nil) async throws {
        await walletKit.rejectSignDataRequest(event)?.then()
    }
}

