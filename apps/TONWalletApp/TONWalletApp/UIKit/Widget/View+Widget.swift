//
//  View+Widget.swift
//  TONWalletApp
//
//  Created by Nikita Rodionov on 30.09.2025.
//

import SwiftUI

extension View {
    
    public func widget(style: WidgetModifier.Style = .regular) -> some View {
        self.modifier(WidgetModifier(style: style))
    }
}

public struct WidgetModifier: ViewModifier {
    private let style: Style
    
    init(style: Style) {
        self.style = style
    }
    
    public func body(content: Content) -> some View {
        content
            .padding(style.edgeInsets)
            .background(style.backgroundColor)
            .border(
                style.borderColor,
                width: style.borderWidth,
                cornerRadius: style.cornerRadius
            )
    }
}

public extension WidgetModifier {
    
    enum Style {
        case regular
        case block(BlockType)
        
        var edgeInsets: EdgeInsets {
            let inset: CGFloat = AppSpacing.spacing(3.0)
            return EdgeInsets(
                top: inset,
                leading: inset,
                bottom: inset,
                trailing: inset
            )
        }
        
        var backgroundColor: Color {
            switch self {
            case .regular: .white
            case .block(let type): type.backgroundColor
            }
        }
        
        var borderColor: Color {
            switch self {
            case .regular: .clear
            case .block(let type): type.borderColor
            }
        }
        
        var borderWidth: CGFloat {
            switch self {
            case .regular: 0.0
            case .block: 1.0
            }
        }
        
        var cornerRadius: CGFloat {
            return 8.0
        }
    }
    
    enum BlockType {
        case regular
        case warning
        
        var backgroundColor: Color {
            switch self {
            case .regular: .TON.gray50
            case .warning: .TON.yellow50
            }
        }
        
        var borderColor: Color {
            switch self {
            case .regular: .clear
            case .warning: .clear
            }
        }
    }
}
