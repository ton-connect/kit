//
//  JSObject.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 12.09.2025.
//

import Foundation
import JavaScriptCore

@dynamicMemberLookup
public protocol JSDynamicMember {
    
    subscript(dynamicMember member: String) -> JSFunction { get }
}

@dynamicCallable
public protocol JSDynamicCallable {
    
    func dynamicallyCall(withArguments args: [Any]) -> JSValue?
}

public protocol JSDynamicObject: JSDynamicMember {
    func invoke(_ functionName: String, arguments: [Any]) -> JSValue?
    func invoke(_ functionName: String) -> JSValue?
}

extension JSDynamicObject {
    
    public func invoke(_ functionName: String) -> JSValue? {
        invoke(functionName, arguments: [])
    }
}

public class JSFunction: JSDynamicCallable, JSDynamicMember {
    let functionName: String
    let dynamicObject: any JSDynamicObject
    
    init(functionName: String, dynamicObject: any JSDynamicObject) {
        self.functionName = functionName
        self.dynamicObject = dynamicObject
    }

    public func dynamicallyCall(withArguments args: [Any]) -> JSValue? {
        dynamicObject.invoke(functionName, arguments: args)
    }
    
    public func dynamicallyCall() -> JSValue? {
        dynamicObject.invoke(functionName)
    }
    
    public subscript(dynamicMember member: String) -> JSFunction {
        JSFunction(functionName: "\(functionName).\(member)", dynamicObject: dynamicObject)
    }
}

extension JSValue: JSDynamicMember {
    
    public subscript(dynamicMember member: String) -> JSFunction {
        JSFunction(functionName: member, dynamicObject: self)
    }
}

extension JSValue: JSDynamicObject {

    public func invoke(_ functionName: String, arguments: [Any]) -> JSValue? {
        invokeMethod(functionName, withArguments: arguments)
    }
    
    public func then(_ onFulfilled: @escaping (JSValue) -> Void) {
        let onFulfilledWrapper: @convention(block) (JSValue) -> Void = { value in
            onFulfilled(value)
        }
        invoke("then", arguments: [unsafeBitCast(onFulfilledWrapper, to: JSValue.self)])
    }
    
    public func then() async -> JSValue {
        return try await withCheckedContinuation { continuation in
            then { value in
                continuation.resume(with: .success(value))
            }
        }
    }
    
    public func catchPromise(_ onFulfilled: @escaping (JSValue) -> Void) {
        let onFulfilledWrapper: @convention(block) (JSValue) -> Void = { value in
            onFulfilled(value)
        }
        invoke("catch", arguments: [unsafeBitCast(onFulfilledWrapper, to: JSValue.self)])
    }
    
    public func catchPromise() async -> JSValue {
        return try await withCheckedContinuation { continuation in
            catchPromise { value in
                continuation.resume(with: .success(value))
            }
        }
    }
}

extension JSContext: JSDynamicMember {
    
    public subscript(dynamicMember member: String) -> JSFunction {
        JSFunction(functionName: member, dynamicObject: self)
    }
}

extension JSContext: JSDynamicObject {
    public var jsContext: JSContext? {
        self
    }
    
    public func invoke(_ functionName: String, arguments: [Any]) -> JSValue? {
        let arguments = arguments.map { element in
            switch element {
            case let string as String:
                return string
            case let numeric as any Numeric:
                return String(describing: numeric)
            case let bool as Bool:
                return bool ? "true" : "false"
            default:
                return String(describing: element)
            }
        }
        let script = "\(functionName)(\(arguments.joined(separator: ", ")))"
        
        return jsContext?.evaluateScript(script)
    }
    
    public func then(_ onFulfilled: @escaping (JSValue) -> Void) {}
}
