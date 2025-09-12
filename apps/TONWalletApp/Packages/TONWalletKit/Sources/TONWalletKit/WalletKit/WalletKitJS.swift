//
//  WalletKitJS.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 12.09.2025.
//

import Foundation

struct WalletKitJS {
    let code: String
    
    private init(code: String) {
        self.code = code
    }
    
    static func load() throws -> Self {
        let jsFile = "walletkit-ios-bridge"
        
        guard let path = Bundle.module.path(forResource: jsFile, ofType: "mjs") else {
            throw "Unable to find walletkit.mjs file"
        }
        
        var code = try String(contentsOfFile: path, encoding: .utf8)
        
        code = code.replacingOccurrences(
            of: "export {\n  A3 as main\n};",
            with: """
            // Make main function available globally for JavaScriptCore
            var main = A3;
            
            // Auto-initialize on load
            console.log('🚀 WalletKit iOS Bridge starting from MJS...');
            try {
                main();
                console.log('✅ WalletKit main() called successfully from MJS');
            } catch (error) {
                console.error('❌ Error calling main() from MJS:', error);
            }
            """
        )
        
        return Self(code: code)
    }
}
