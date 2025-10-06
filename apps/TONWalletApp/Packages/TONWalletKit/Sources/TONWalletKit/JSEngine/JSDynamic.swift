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
    
    func dynamicallyCall(withArguments args: [Any]) async throws -> JSValue?
}

public protocol JSDynamicObject: JSDynamicMember {
    var jsContext: JSContext? { get }

    func object(_ name: String) throws -> JSValue?
}

public struct JSFunction: JSDynamicCallable, JSDynamicMember {
    let name: String
    let target: any JSDynamicObject
    
    init(name: String, target: any JSDynamicObject) {
        self.name = name
        self.target = target
    }
    
    public func dynamicallyCall(withArguments args: [Any]) async throws -> JSValue? {
        try await target.jsContext?.promise(
            wrap: self,
            args: normalize(args: args)
        ).then()
    }
    
    public func dynamicallyCall() async throws -> JSValue? {
        try await target.jsContext?.promise(
            wrap: self,
            args: []
        ).then()
    }
    
    public subscript(dynamicMember member: String) -> JSFunction {
        JSFunction(name: "\(name).\(member)", target: target)
    }
    
    private func normalize(args: [Any]) throws -> [Any] {
        try args.map { element in
            switch element {
            case let string as String:
                return string
            case let numeric as any Numeric:
                return String(describing: numeric)
            case let bool as Bool:
                return bool
            default:
                if let element = element as? Encodable {
                    let encoder = JSONEncoder()
                    
                    let data = try encoder.encode(element)
                    let dictionary = try JSONSerialization.jsonObject(with: data)
                    
                    return JSValue(object: dictionary, in: target.jsContext)
                }
                return element
            }
        }
    }
}

extension JSValue: JSDynamicMember {
    
    public subscript(dynamicMember member: String) -> JSFunction {
        JSFunction(name: member, target: self)
    }
}

extension JSValue: JSDynamicObject {
    public var jsContext: JSContext? { context }
    
    public func object(_ name: String) throws -> JSValue? {
        let path = name.split(separator: ".")
        
        if path.isEmpty {
            throw "Empty JS Object name provided"
        }
        
        var object: JSValue? = self
        
        for part in path {
            object = object?.objectForKeyedSubscript(part)
            
            guard let object, !object.isUndefined else {
                throw "No object named \(part) found in \(name)"
            }
        }
        return object
    }
    
    fileprivate func then(
        _ onResolved: @escaping (JSValue) -> Void,
        _ onRejected: @escaping (JSValue) -> Void,
    ) {
        let onResolvedWrapper: @convention(block) (JSValue) -> Void = { value in
            onResolved(value)
        }
        
        let onRejectedWrapper: @convention(block) (JSValue) -> Void = { value in
            onRejected(value)
        }
        invokeMethod(
            "then",
            withArguments: [
                unsafeBitCast(onResolvedWrapper, to: JSValue.self),
                unsafeBitCast(onRejectedWrapper, to: JSValue.self)
            ]
        )
    }
    
    fileprivate func then() async throws -> JSValue {
        try await withCheckedThrowingContinuation { continuation in
            then(
                { continuation.resume(returning: $0) },
                { continuation.resume(throwing: $0.toString()) }
            )
        }
    }
}

extension JSContext: JSDynamicMember {
    
    public subscript(dynamicMember member: String) -> JSFunction {
        JSFunction(name: member, target: self)
    }
}

extension JSContext: JSDynamicObject {
    public var jsContext: JSContext? { self }
    
    public func object(_ name: String) throws -> JSValue? {
        let path = name.split(separator: ".")
        
        if path.isEmpty {
            throw "Empty JS Object name provided"
        }
        
        let firstPath = path[0]
        
        guard let object = objectForKeyedSubscript(firstPath), !object.isUndefined else {
            throw "No object named \(firstPath) found in \(name)"
        }
        
        if path.count == 1 {
            return object
        }
        
        return try object.object(String(name.dropFirst(firstPath.count + 1)))
    }
}

private extension JSContext {
    
    func promise(wrap function: JSFunction, args: [Any]) async throws -> JSValue {
        let functionName = "__promiseWrapper"
        
        if let promiseWrapper = try? object(functionName) {
            return try await call(function: function, args: args, on: promiseWrapper)
        }
        
        let script = """
            function \(functionName)(fn, context = null, ...args) {
                try {
                  const result = fn.apply(context, args);
                  
                  if (result instanceof Promise) {
                    return result;
                  } else {
                    return Promise.resolve(result);
                  }
                } catch (error) {
                    return Promise.reject(error);
                }
            }
        """
        
        evaluateScript(script)
        
        guard let promiseWrapper = try? object(functionName) else {
            throw "JSFunctionError: No promise wrapper found"
        }
        
        return try await call(function: function, args: args, on: promiseWrapper)
    }
    
    private func call(function: JSFunction, args: [Any], on promiseWrapper: JSValue) async throws -> JSValue {
        guard let targetFunction = try? function.target.object(function.name) else {
            throw "JSFunctionError: No target function found for name \(function.name)"
        }
        
        let object = function.target as? JSValue
        
        return promiseWrapper.call(withArguments: [targetFunction as Any, object as Any] + args)
    }
}
