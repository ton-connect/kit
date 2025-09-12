//
//  ContentView.swift
//  TONWalletApp
//
//  Created by Nikita Rodionov on 11.09.2025.
//

import SwiftUI
import JavaScriptCore
import TONWalletKit

@MainActor
struct ContentView: View {
    @State var engine = WalletKitEngine(configuration: WalletKitConfig(
        network: .testnet, // Use testnet for demo
        storage: .memory,  // Use memory storage for demo
        manifestUrl: "https://raw.githubusercontent.com/ton-connect/demo-dapp-with-wallet/master/public/tonconnect-manifest.json"
    ))
    
    @State var address: String?
    @State var balance: Int?
    
    var body: some View {
        VStack {
            Image(systemName: "globe")
                .imageScale(.large)
                .foregroundStyle(.tint)
            Text("Hello, world!")
            Button("Start engine") {
                Task {
                    do {
                        try await engine.start()
                    } catch {
                        debugPrint(error.localizedDescription)
                    }
                }
            }
            Button("Add Wallet") {
                Task {
                    let mnemonic = "enough pelican siege aspect ginger capital blur pact collect drum antique tackle cradle woman tribe suspect figure drill disease panel useful staff surprise salute"
                    let tonMnemonic = TONMnemonic(value: mnemonic.split(separator: " ").map { String($0) })
                    let data = TONWalletData(mnemonic: tonMnemonic, name: "Test")
                    
                    do {
                        let wallet = try await TONWallet.add(data: data)
                        address = try await wallet.address()
                        balance = try await wallet.balance()
                    } catch {
                        debugPrint(error.localizedDescription)
                    }
                }
            }
            
            if let address {
                Text(address)
            }
            
            if let balance {
                Text("\(balance)")
            }
        }
        .padding()
    }
}

#Preview {
    ContentView()
}
