import Foundation
import JavaScriptCore

let timerJSSharedInstance = TimerJS()

@objc protocol TimerJSExport : JSExport {

    func setTimeout(_ callback : JSValue,_ ms : Double) -> String

    func clearTimeout(_ identifier: String)

    func setInterval(_ callback : JSValue,_ ms : Double) -> String
    
    func clearInterval(_ identifier: String)

}

// Custom class must inherit from `NSObject`
@objc class TimerJS: NSObject, TimerJSExport {
    var timers = [String: Timer]()

    static func registerInto(jsContext: JSContext, forKeyedSubscript: String = "timerJS") {
        jsContext.setObject(timerJSSharedInstance,
                            forKeyedSubscript: forKeyedSubscript as (NSCopying & NSObjectProtocol))
        jsContext.evaluateScript(
            "function setTimeout(callback, ms) {" +
            "    if (typeof callback !== 'function') throw new Error('setTimeout: callback must be a function');" +
            "    return timerJS.setTimeout(callback, ms || 0)" +
            "}" +
            "function clearTimeout(identifier) {" +
            "    timerJS.clearTimeout(identifier)" +
            "}" +
            "function setInterval(callback, ms) {" +
            "    if (typeof callback !== 'function') throw new Error('setInterval: callback must be a function');" +
            "    return timerJS.setInterval(callback, ms || 0)" +
            "}" +
            "function clearInterval(identifier) {" +
            "    timerJS.clearTimeout(identifier)" +
            "}"
        )       
    }

    @objc func callJsCallback(timer: Timer) { 
        guard let callback = timer.userInfo as? JSValue else {
            print("Warning: Timer callback is not a JSValue")
            return
        }
        
        // Ensure callback is still valid before calling
        guard !callback.isUndefined && !callback.isNull else {
            print("Warning: Timer callback became undefined or null")
            return
        }
        
        callback.call(withArguments: nil) 
    }
    
    func clearTimeout(_ identifier: String) {
        let timer = timers.removeValue(forKey: identifier)
        timer?.invalidate()
    }
    
    func clearInterval(_ identifier: String) {
        // clearInterval is the same as clearTimeout - both clear timers
        clearTimeout(identifier)
    }


    func setInterval(_ callback: JSValue,_ ms: Double) -> String {
        return createTimer(callback: callback, ms: ms, repeats: true)
    }

    func setTimeout(_ callback: JSValue, _ ms: Double) -> String {
        return createTimer(callback: callback, ms: ms , repeats: false)
    }

    func createTimer(callback: JSValue, ms: Double, repeats : Bool) -> String {
        // Validate callback
        guard !callback.isUndefined && !callback.isNull else {
            print("Warning: Timer callback is undefined or null")
            return ""
        }
        
        // Ensure minimum timeout to prevent excessive CPU usage
        let timeInterval = max(ms, 0) / 1000.0
        let uuid = NSUUID().uuidString

        // make sure that we are queueing it all in the same executable queue...
        // JS calls are getting lost if the queue is not specified... that's what we believe... ;)
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
}
