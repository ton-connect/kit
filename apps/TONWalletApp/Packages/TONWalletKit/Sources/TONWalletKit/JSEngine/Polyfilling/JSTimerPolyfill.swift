//
//  JSTimerPolyfill.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 11.09.2025.
//

import Foundation
import JavaScriptCore

public class JSTimerPolyfill: NSObject, JSPolyfill {
    private var timers: [String: Timer] = [:]
    
    deinit {
        clear()
    }
    
    public func apply(to context: JSContext) {
        let clearInterval: @convention(block) (String) -> () = { identifier in
            self.removeTimer(identifier: identifier)
        }
        
        let clearTimeout: @convention(block) (String) -> () = { identifier in
            self.removeTimer(identifier: identifier)
        }
        
        let setInterval: @convention(block) (JSValue, Double) -> String = { (callback, interval) in
            return self.createTimer(
                callback: callback,
                interval: interval,
                repeats: true
            )
        }
        
        let setTimeout: @convention(block) (JSValue, Double) -> String = { (callback, interval) in
            return self.createTimer(
                callback: callback,
                interval: interval,
                repeats: false
            )
        }
        
        context.setObject(clearInterval,
                          forKeyedSubscript: "clearInterval" as NSString)
        
        context.setObject(clearTimeout,
                          forKeyedSubscript: "clearTimeout" as NSString)
        
        context.setObject(setInterval,
                          forKeyedSubscript: "setInterval" as NSString)
        
        context.setObject(setTimeout,
                          forKeyedSubscript: "setTimeout" as NSString)
    }
    
    private func createTimer(callback: JSValue, interval: Double, repeats : Bool) -> String {
        if callback.isUndefined || callback.isNull {
            debugPrint("Warning: Timer callback is undefined or null")
            return ""
        }
        
        let timeInterval = max(0.0, interval) / 1000.0
        
        let uuid = NSUUID().uuidString
        
        DispatchQueue.main.async(execute: {
            let timer = Timer.scheduledTimer(timeInterval: timeInterval,
                                             target: self,
                                             selector: #selector(self.callJsCallback),
                                             userInfo: callback,
                                             repeats: repeats)
            self.timers[uuid] = timer
        })
        
        return uuid
    }
    
    @objc
    private func callJsCallback(_ timer: Timer) {
        guard let callback = timer.userInfo as? JSValue, callback.isObject else {
            return
        }
        callback.call(withArguments: nil)
    }
    
    private func removeTimer(identifier: String) {
        let timer = self.timers.removeValue(forKey: identifier)
        
        timer?.invalidate()
    }
    
    private func clear() {
        for (_, timer) in timers {
            timer.invalidate()
        }
        timers.removeAll()
    }
}
