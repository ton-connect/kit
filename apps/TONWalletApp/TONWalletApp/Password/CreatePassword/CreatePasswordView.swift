//
//  CreatePasswordView.swift
//  TONWalletApp
//
//  Created by Nikita Rodionov on 06.10.2025.
//

import SwiftUI

struct CreatePasswordView: View {
    @StateObject private var viewModel = CreatePasswordViewModel()
    
    @EnvironmentObject var appStateManager: TONWalletAppStateManager
    
    var body: some View {
        VStack(spacing: AppSpacing.spacing(4.0)) {
            Text("Create Password")
                .text2XL(weight: .bold)
                .foregroundColor(Color.TON.gray900)
            
            Text("Your password will be used to encrypt your wallet data locally.")
                .textSM()
                .foregroundColor(Color.TON.gray600)
                .multilineTextAlignment(.center)
                .padding(.horizontal, AppSpacing.spacing(4.0))
                .fixedSize(horizontal: false, vertical: true)
            
            // Form Card
            VStack(spacing: AppSpacing.spacing(4.0)) {
                // Password Field
                VStack(alignment: .leading, spacing: AppSpacing.spacing(2.0)) {
                    Text("Password")
                        .textSM(weight: .medium)
                        .foregroundColor(Color.TON.gray700)
                    
                    SecureField("Enter a strong password", text: $viewModel.password)
                        .textFieldStyle(TONTextFieldStyle())
                        .textContentType(.none)
                        .autocorrectionDisabled()
                    
                    Text("At least 8 characters with uppercase, lowercase, and numbers")
                        .textSM()
                        .foregroundColor(Color.TON.gray700)
                        .multilineTextAlignment(.leading)
                        .fixedSize(horizontal: false, vertical: true)
                }
                
                // Confirm Password Field
                VStack(alignment: .leading, spacing: 8) {
                    Text("Confirm Password")
                        .textSM(weight: .medium)
                        .foregroundColor(Color.TON.gray700)
                    
                    SecureField("Confirm your password", text: $viewModel.confirmPassword)
                        .textFieldStyle(TONTextFieldStyle())
                        .textContentType(.none)
                        .autocorrectionDisabled()
                }
                
                Button("Continue") {
                    Task {
                        if await viewModel.continue() {
                            appStateManager.unlock()
                        }
                    }
                }
                .buttonStyle(TONButtonStyle(type: .primary))
                .disabled(!viewModel.canContinue)
            }
            .widget()
            
            // Warning Message
            HStack(alignment: .top, spacing: 8) {
                Text("⚠️")
                    .textSM()
                
                Text("Make sure to remember your password.\nIt cannot be recovered if forgotten.")
                    .textSM()
                    .foregroundColor(Color.TON.gray500)
            }
            .fixedSize(horizontal: false, vertical: true)
            
            Spacer()
        }
        .padding(.horizontal, AppSpacing.spacing(5.0))
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.TON.gray100)
        .ignoresSafeArea(.keyboard)
    }
}
