//
//  TONWalletApp.swift
//  TONWalletApp
//
//  Created by Nikita Rodionov on 11.09.2025.
//

import SwiftUI

@main
struct TONWalletApp: App {
    var body: some Scene {
        WindowGroup {
            NavigationStack {
                SetupWalletView()
            }
        }
    }
}
