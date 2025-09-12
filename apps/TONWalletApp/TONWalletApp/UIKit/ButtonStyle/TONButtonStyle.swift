//
//  TONButtonStyle.swift
//  TONWalletApp
//
//  Created by Nikita Rodionov on 12.09.2025.
//

import SwiftUI

struct TONButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled

    /// The configuration for the button style.
    let type: TONButtonType
    let isLoading: Bool
    
    init(type: TONButtonType, isLoading: Bool = false) {
        self.type = type
        self.isLoading = isLoading
    }

    public func makeBody(configuration: Configuration) -> some View {
        return ZStack(alignment: .center) {
            if isLoading {
                ProgressView()
            } else {
                configuration.label
                    .font(.headline)
                    .foregroundColor(type.textColor)
            }
        }
        .frame(
            maxWidth: .infinity,
            minHeight: 50.0,
            maxHeight: 50.0
        )
        .contentShape(.rect)
        .padding(.horizontal, 16.0)
        .background(type.backgroundColor)
        .cornerRadius(8.0)
        .opacity(isEnabled ? 1.0 : 0.3)
        .allowsHitTesting(!isLoading)
    }
}

enum TONButtonType {
    case primary
    case secondary
    
    var textColor: Color {
        switch self {
        case .primary: .white
        case .secondary: .black
        }
    }
    
    var backgroundColor: Color {
        switch self {
        case .primary: .blue
        case .secondary: Color(UIColor.lightGray)
        }
    }
}
