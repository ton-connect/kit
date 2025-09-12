//
//  MnemonicInputView.swift
//  TONWalletApp
//
//  Created by Nikita Rodionov on 12.09.2025.
//

import Foundation
import SwiftUI
import TONWalletKit

struct MnemonicInputView: View {
    @Binding var mnemonic: TONMnemonic
    
    var body: some View {
        VStack(alignment: .center, spacing: 20) {
            
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 3), spacing: 12) {
                ForEach(0..<TONMnemonicLenght.bits256.rawValue, id: \.self) { index in
                    HStack(spacing: 8) {
                        
                        TextField(
                            "\(index + 1)",
                            text: Binding(
                                get: { mnemonic.value[index]
                                },
                                set: {
                                    mnemonic.update(
                                        word: $0.lowercased().trimmingCharacters(in: .whitespacesAndNewlines),
                                        at: index
                                    )
                                }
                            )
                        )
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                        .font(.system(.body, design: .monospaced))
                        .multilineTextAlignment(.center)
                    }
                }
            }
        }
        .padding()
    }
}
