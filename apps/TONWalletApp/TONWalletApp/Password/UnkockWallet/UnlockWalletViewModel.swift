//
//  UnlockWalletViewModel.swift
//  TONWalletApp
//
//  Created by Nikita Rodionov on 06.10.2025.
//

import Foundation
import LocalAuthentication

@MainActor
class UnlockWalletViewModel: ObservableObject {
    @Published var error: String?
    @Published var password: String = ""
    
    private let passwordStorage = PasswordStorage()
    private let walletsStorage = WalletsStorage()
    
    var canUnlock: Bool {
        !password.isEmpty
    }
    
    func checkPassword() -> Bool {
        do {
            let existingPassword = try passwordStorage.password()
            let isEqual = existingPassword == password
            
            if !isEqual {
                error = "Invalid password"
            }
            
            return isEqual
        } catch {
            debugPrint(error.localizedDescription)
            return false
        }
    }
    
    func reset() {
        try? passwordStorage.removePassword()
        try? walletsStorage.removeAllWallets()
    }
    
    func tryBiometryAuthentication() async -> Bool {
        let context = LAContext()
        var error: NSError?
        
        let canEvaluate = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
        
        if canEvaluate {
            do {
                let result = try await context.evaluatePolicy(
                    .deviceOwnerAuthenticationWithBiometrics,
                    localizedReason: "This app uses Face ID to authenticate the user."
                )
                
                if result {
                    fillPassword()
                }
                return result
            } catch {}
        }
        return false
    }
    
    private func fillPassword() {
        do {
            password = try passwordStorage.password() ?? ""
        } catch {
            debugPrint(error.localizedDescription)
        }
    }
}
