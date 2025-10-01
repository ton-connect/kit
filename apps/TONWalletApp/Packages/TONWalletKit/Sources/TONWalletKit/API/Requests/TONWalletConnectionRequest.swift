//
//  TONWalletConnectionRequest.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 01.10.2025.
//

import Foundation

public class TONWalletConnectionRequest {
    public var preview: ConnectRequestEvent.Preview? { event.preview }
    
    let walletKit: any JSDynamicObject
    let event: ConnectRequestEvent
    
    init(
        walletKit: any JSDynamicObject,
        event: ConnectRequestEvent
    ) {
        self.walletKit = walletKit
        self.event = event
    }
    
    public func approve(walletAddress: String) async throws {
        var event = self.event
        event.walletAddress = walletAddress
        await walletKit.approveConnectRequest(event)?.then()
    }
    
    public func reject(reason: String? = nil) async throws {
        await walletKit.rejectConnectRequest(event)?.then()
    }
}
