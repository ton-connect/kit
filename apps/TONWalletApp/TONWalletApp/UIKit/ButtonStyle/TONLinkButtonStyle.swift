//
//  TONLinkButtonStyle.swift
//  TONWalletApp
//
//  Created by Nikita Rodionov on 12.09.2025.
//

import SwiftUI

struct TONLinkButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled

    /// The configuration for the button style.
    let type: TONLinkButtonType
    
    init(type: TONLinkButtonType) {
        self.type = type
    }

    public func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.subheadline)
            .foregroundColor(type.textColor)
            .underline()
            .opacity(isEnabled ? 1.0 : 0.3)
    }
}

enum TONLinkButtonType {
    case primary
    case secondary
    
    var textColor: Color {
        switch self {
        case .primary: .blue
        case .secondary: Color(UIColor.lightGray)
        }
    }
}
