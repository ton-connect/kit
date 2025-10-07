//
//  UnlockWalletView.swift
//  TONWalletApp
//
//  Created by Nikita Rodionov on 06.10.2025.
//

import SwiftUI

struct UnlockWalletView: View {
    @StateObject private var viewModel = UnlockWalletViewModel()
    
    @EnvironmentObject var appStateManager: TONWalletAppStateManager
    
    var body: some View {
        VStack(spacing: AppSpacing.spacing(4.0)) {
            Text("Welcome Back")
                .text2XL(weight: .bold)
                .foregroundColor(Color.TON.gray900)
            
            Text("Enter your password to unlock your wallet.")
                .textSM()
                .foregroundColor(Color.TON.gray600)
                .multilineTextAlignment(.center)
                .padding(.horizontal, AppSpacing.spacing(4.0))
            
            // Form Card
            VStack(spacing: AppSpacing.spacing(4.0)) {
                // Password Field
                VStack(alignment: .leading, spacing: AppSpacing.spacing(2.0)) {
                    Text("Password")
                        .textSM(weight: .medium)
                        .foregroundColor(Color.TON.gray700)
                    
                    SecureField("Enter your password", text: $viewModel.password)
                        .textFieldStyle(TONTextFieldStyle())
                        .textContentType(.password)
                }
                
                if let error = viewModel.error {
                    Text(error)
                        .textSM()
                        .foregroundStyle(Color.TON.red600)
                }
                
                Button("Unlock Wallet") {
                    unlock()
                }
                .buttonStyle(TONButtonStyle(type: .primary))
                .disabled(!viewModel.canUnlock)
            }
            .widget()
            
            // Reset Wallet Section
            VStack(spacing: AppSpacing.spacing(2.0)) {
                Button("Reset Wallet") {
                    viewModel.reset()
                    appStateManager.reset()
                }
                .buttonStyle(TONButtonStyle(type: .secondary))
                
                Text("This will permanently delete your wallet data")
                    .textSM()
                    .foregroundColor(Color.TON.gray500)
                    .multilineTextAlignment(.center)
            }
            .padding(.top, AppSpacing.spacing(2.0))
            
            Spacer()
        }
        .padding(.horizontal, AppSpacing.spacing(5.0))
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.TON.gray100)
        .task {
            if await viewModel.tryBiometryAuthentication() {
                unlock()
            }
        }
    }
    
    private func unlock() {
        if viewModel.checkPassword() {
            appStateManager.unlock()
        }
    }
}
