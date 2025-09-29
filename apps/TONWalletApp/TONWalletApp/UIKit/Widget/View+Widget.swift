//
//  View+Widget.swift
//  TONWalletApp
//
//  Created by Nikita Rodionov on 30.09.2025.
//

import SwiftUI

extension View {
    
    func widget() -> some View {
        self
            .padding(16.0)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 8.0))
    }
}
