//
//  View.swift
//  TONWalletApp
//
//  Created by Nikita Rodionov on 03.10.2025.
//

import SwiftUI

public extension View {
    
    func size(_ size: CGFloat) -> some View {
        self.frame(width: size, height: size)
    }
    
    func border<S>(
        _ content: S,
        width: CGFloat = 1,
        cornerRadius: CGFloat,
        corners: UIRectCorner = .allCorners
    ) -> some View where S: ShapeStyle {
        let roundedRect = RoundedRectangle(cornerRadius: cornerRadius)
        return clipShape(roundedRect)
            .overlay(roundedRect.stroke(content, lineWidth: width))
    }
    
    func update(_ processor: (inout Self) -> Void) -> some View {
        var mutableSelf = self
        processor(&mutableSelf)
        return mutableSelf
    }
    
    func eraseToAnyView() -> AnyView {
        AnyView(self)
    }
    
    @ViewBuilder
    func presentationBackgroundColor(_ color: Color) -> some View {
        if #available(iOS 16.4, *) {
            self.presentationBackground(color)
        } else {
            ZStack {
                color.edgesIgnoringSafeArea(.all)
                self
            }
        }
    }
    
    func forceNavigationBarVisible() -> some View {
        self.toolbar {
            ToolbarItem(placement: .principal) {
                Color.clear
            }
        }
    }
}
