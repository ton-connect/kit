//
//  TONWalletKit.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 12.09.2025.
//

import Foundation

@dynamicMemberLookup
public struct TONWalletKit {
    static private(set) var engine: (any JSEngine)!
    
    public static func initialize(
        configuration: WalletKitConfig,
        eventsHandler: any TONBridgeEventsHandler
    ) async throws {
        guard engine == nil else {
            return
        }
        
        engine = WalletKitEngine(configuration: configuration, eventsHandler: eventsHandler)
        try await engine.start()
    }
    
    public static subscript(dynamicMember member: String) -> JSFunction {
        engine[dynamicMember: member]
    }
}

public protocol TONBridgeEventsHandler {
    
    func handle(event: WalletKitEvent)
}
