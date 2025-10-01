//
//  WalletKitEvent.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 11.09.2025.
//

import Foundation

public enum WalletKitEvent {
    case connectRequest(TONWalletConnectionRequest)
    case transactionRequest(TransactionRequestEvent)
    case signDataRequest(SignDataRequestEvent)
    case disconnect(DisconnectEvent)
    case stateChanged
    
    init?(bridgeEvent: JSWalletKitSwiftBridgeEvent, walletKit: any JSDynamicObject) {
        let decoder = JSONDecoder()
        
        do {
            switch bridgeEvent.type {
            case .connectRequest:
                let event = try decoder.decode(ConnectRequestEvent.self, from: bridgeEvent.data)
                self = .connectRequest(TONWalletConnectionRequest(walletKit: walletKit, event: event))
            case .transactionRequest:
                self = .transactionRequest(try decoder.decode(TransactionRequestEvent.self, from: bridgeEvent.data))
            case .signDataRequest:
                self = .signDataRequest(try decoder.decode(SignDataRequestEvent.self, from: bridgeEvent.data))
            case .disconnect:
                self = .disconnect(try decoder.decode(DisconnectEvent.self, from: bridgeEvent.data))
            }
        } catch {
            debugPrint("Unable to decode event with type: \(bridgeEvent.type)")
            return nil
        }
    }
}
