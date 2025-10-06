//
//  DAppView.swift
//  TONWalletApp
//
//  Created by Nikita Rodionov on 03.10.2025.
//

import SwiftUI
import TONWalletKit

public struct DAppView: View {
    let dAppInfo: DAppInfo
    
    public var body: some View {
        HStack(spacing: AppSpacing.spacing(3.0)) {
            AsyncImage(url: dAppInfo.iconUrl)
                .size(48.0)
                .clipShape(RoundedRectangle(cornerRadius: AppRadius.standard))
            
            VStack(alignment: .leading, spacing: AppSpacing.spacing(2)) {
                Text(dAppInfo.name ?? "")
                    .textLG(weight: .semibold)
                    .foregroundStyle(Color.TON.gray900)
                    .multilineTextAlignment(.leading)
                
                Text(dAppInfo.url?.absoluteString ?? "")
                    .textSM()
                    .foregroundStyle(Color.TON.gray500)
                    .multilineTextAlignment(.leading)
            }
        }
        .widget(style: .block(.regular))
    }
}
