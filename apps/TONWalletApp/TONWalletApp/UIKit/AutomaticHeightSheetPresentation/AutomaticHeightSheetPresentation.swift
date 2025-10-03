//
//  AutomaticHeightSheetPresentation.swift
//  TONWalletApp
//
//  Created by Nikita Rodionov on 03.10.2025.
//

import SwiftUI

/// An extension to the `View` protocol, providing a method to apply automatic height presentation detents to sheets.
public extension View {

    /// Applies automatic height-based presentation detents to the view when presented as a sheet.
    ///
    /// This modifier dynamically adjusts the sheet's height based on the content's intrinsic height,
    /// ensuring that the sheet resizes appropriately as the content changes. Additional detents can be
    /// provided to offer fixed heights alongside the automatic adjustment.
    ///
    /// - Parameter detents: A set of additional `PresentationDetent` values to include alongside the automatic height detent.
    ///                      Defaults to an empty set.
    /// - Returns: A view modified to present a sheet with automatic height detents.
    func automaticHeightPresentationDetents(_ detents: Set<PresentationDetent> = []) -> some View {
        self.modifier(AutomaticHeightSheetPresentationModifier(detents: detents))
    }
}

/// A view modifier that adjusts the sheet's presentation detents based on the content's height.
struct AutomaticHeightSheetPresentationModifier: ViewModifier {
    /// The current automatic height of the content.
    @State private var automaticHeight: CGFloat = 0

    /// A set of additional presentation detents to include.
    let detents: Set<PresentationDetent>

    func body(content: Content) -> some View {
        content
            .background(
                GeometryReader { geometry in
                    Color.clear
                        .onAppear {
                            automaticHeight = geometry.size.height
                        }
                        .onChange(of: geometry.size.height) { newHeight in
                            automaticHeight = newHeight
                        }
                }
            )
            .presentationDetents(Set<PresentationDetent>([.height(automaticHeight)]).union(detents))
    }
}
