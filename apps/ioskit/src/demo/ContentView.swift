//
//  ContentView.swift
//  Native SwiftUI Demo App for TonWalletKit
//

import SwiftUI

struct ContentView: View {
    var body: some View {
        WalletKitView(config: walletKitConfig)
    }
    
    private var walletKitConfig: WalletKitConfig {
        WalletKitConfig(
            apiKey: nil, // Add your API key here if needed
            network: .mainnet,
            storage: .local,
            manifestUrl: "https://raw.githubusercontent.com/ton-connect/demo-dapp-with-wallet/master/public/tonconnect-manifest.json"
        )
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
