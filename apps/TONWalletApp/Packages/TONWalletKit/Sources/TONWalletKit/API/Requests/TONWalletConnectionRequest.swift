//
//  TONWalletConnectionRequest.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 01.10.2025.
//

import Foundation

public class TONWalletConnectionRequest {
    let walletKit: any JSDynamicObject
    let event: ConnectRequestEvent
    
    public var dAppInfo: DAppInfo? { event.dAppInfo }
    public var permissions: [ConnectRequestEvent.Preview.ConnectPermission] { event.preview?.permissions ?? [] }
    
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
        await try walletKit.approveConnectRequest(event)
    }
    
    public func reject(reason: String? = nil) async throws {
        await try  walletKit.rejectConnectRequest(event)
    }
}
