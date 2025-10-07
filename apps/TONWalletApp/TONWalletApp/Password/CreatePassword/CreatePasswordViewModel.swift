//
//  CreatePasswordViewModel.swift
//  TONWalletApp
//
//  Created by Nikita Rodionov on 06.10.2025.
//

import Foundation
import LocalAuthentication

@MainActor
class CreatePasswordViewModel: ObservableObject {
    @Published var password = ""
    @Published var confirmPassword = ""
    
    private let passwordStorage = PasswordStorage()
    
    var isPasswordValid: Bool {
        password.count >= 8 &&
        password.contains(where: { $0.isUppercase }) &&
        password.contains(where: { $0.isLowercase }) &&
        password.contains(where: { $0.isNumber })
    }
    
    var passwordsMatch: Bool {
        !confirmPassword.isEmpty && password == confirmPassword
    }
    
    var canContinue: Bool {
        isPasswordValid && passwordsMatch
    }
    
    func `continue`() async -> Bool {
        guard canContinue else {
            return false
        }
        
        do {
            try passwordStorage.set(password: password)
            await requestBiometry()
            return true
        } catch {
            debugPrint(error.localizedDescription)
            return false
        }
    }
    
    private func requestBiometry() async {
        let context = LAContext()
        var error: NSError?
        
        let canEvaluate = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
        
        if canEvaluate && context.biometryType != .none {
            do {
                try await context.evaluatePolicy(
                    .deviceOwnerAuthenticationWithBiometrics,
                    localizedReason: "This app uses Face ID to authenticate the user."
                )
            } catch {
                debugPrint(error.localizedDescription)
            }
        }
    }
}
