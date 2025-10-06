//
//  JSCoreExtrasFileHandle.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 13.09.2025.
//

import Foundation

class JSCoreExtrasFileHandle: NSObject {
    private let handle: FileHandle
    
    init(url: URL) throws {
        self.handle = try FileHandle(forReadingFrom: url)
        
        super.init()
    }
    
    func read(fromOffset: UInt64, count: UInt64) throws -> Data? {
        try handle.seek(toOffset: fromOffset)
        return try handle.read(upToCount: Int(count))
    }
}
