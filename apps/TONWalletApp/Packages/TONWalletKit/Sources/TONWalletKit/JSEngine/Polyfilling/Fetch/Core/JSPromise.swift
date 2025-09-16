//import IssueReporting
@preconcurrency import JavaScriptCore

// MARK: - JSPromise

/// A data type that implements Promise functionallity over a `JSValue`.
public struct JSPromise: Sendable {
  private let transfer: UnsafeJSValueTransfer

  /// The underlying `JSValue` of this promise.
  public var value: JSValue {
    self.transfer.value
  }

  private init(_ value: JSValue) {
    self.transfer = UnsafeJSValueTransfer(value: value)
  }
}

// MARK: - Value Init

extension JSPromise {
  /// Attempts to create a promise from an ordinary `JSValue`.
  ///
  /// This initializer will return nil if the value is not an instance of a Javascript Promise.
  ///
  /// - Parameter value: An ordinary `JSValue`.
  public init?(value: JSValue) {
    guard let promiseConstructor = value.context.objectForKeyedSubscript("Promise") else {
      return nil
    }
    guard value.isInstance(of: promiseConstructor) else { return nil }
    self.transfer = UnsafeJSValueTransfer(value: value)
  }
}

// MARK: - Resolved Value

extension JSPromise {
  /// Awaits for the resolved value of this promise.
  ///
  /// If the promise is rejected, a ``JSPromiseRejectedError`` will be thrown with the thrown
  /// `JSValue` instead.
  public var resolvedValue: JSValue {
    get async throws {
      try await withUnsafeThrowingContinuation { continuation in
        self.then {
          continuation.resume(returning: $0)
          return JSValue(undefinedIn: $0.context)
        } onRejected: {
          continuation.resume(throwing: JSPromiseRejectedError(reason: $0))
          return JSValue(undefinedIn: $0.context)
        }
      }
    }
  }
}

// MARK: - Static Init

extension JSPromise {
  /// Creates a promise that resolves instantly.
  ///
  /// This is equivalent to calling `Promise.resolve` in Javascript.
  ///
  /// - Parameters:
  ///   - value: The value to resolve to.
  ///   - context: The context to resolve the value in.
  /// - Returns: A promise that resolves.
  public static func resolve(_ value: Any?, in context: JSContext) -> Self {
    Self(JSValue(newPromiseResolvedWithResult: value, in: context))
  }

  /// Creates a promise that rejects instantly.
  ///
  /// This is equivalent to calling `Promise.reject` in Javascript.
  ///
  /// - Parameters:
  ///   - reason: The value to reject with.
  ///   - context: The context to reject the value in.
  /// - Returns: A promise that rejects.
  public static func reject(_ reason: Any?, in context: JSContext) -> Self {
    Self(JSValue(newPromiseRejectedWithReason: reason, in: context))
  }
}

// MARK: - Continuation Init

extension JSPromise {
  /// A mechanism to interface between synchronous code and a ``JSPromise``.
  ///
  /// See ``JSPromise/init(in:perform:)`` for more information.
  public struct Continuation: Sendable {
    private let storage: Storage

    /// The `JSContext` held by this continuation.
    public var context: JSContext { self.storage.context }

    fileprivate var value: JSValue { self.storage.value }

    fileprivate init(context: JSContext) {
      self.storage = Storage(context: context)
    }

    /// Resumes this continuation by resolving the promise to the specified value.
    ///
    /// - Parameter value: The `JSValue` to resolve the promise to.
    public func resume(resolving value: Any?) {
      self.storage.resume(resolving: value)
    }

    /// Resumes this continuation by rejected the promise with the specified reason.
    ///
    /// - Parameter reason: The `JSValue` to reject with.
    public func resume(rejecting reason: Any?) {
      self.storage.resume(rejecting: reason)
    }

    /// Resumes this continuation with a result of either a successfully resolved `JSValue`, or
    /// a rejected reason within a ``JSValueError``.
    public func resume(result: Result<Any?, JSValueError>) {
      switch result {
      case let .success(value): self.resume(resolving: value)
      case let .failure(error): self.resume(rejecting: error.value)
      }
    }
  }

  /// Creates a promise using a closure to perform asynchronous work with a ``Continuation``.
  ///
  /// You can use this initializer to interop a Javascript Promise with generic swift code.
  ///
  /// ```swift
  /// func calc() async throws -> Int32 {
  ///   // ...
  /// }
  ///
  /// let promise = JSPromise(in: .current()) { continuation in
  ///   Task {
  ///     do {
  ///       continuation.resume(
  ///         resolving: JSValue(int32: try await calc(), in: continuation.context)
  ///       )
  ///     } catch {
  ///       continuation.resume(rejecting: JSValue(object: "failed", in: continuation.context))
  ///     }
  ///   }
  /// }
  /// ```
  ///
  /// You can only call `resume` once on a ``Continuation``, as resolving a Promise more than
  /// once has no effect in Javascript. A runtime warning will be issued if you call `resume`
  /// multiple times.
  ///
  /// ```swift
  /// func calc() async throws -> Int32 {
  ///   // ...
  /// }
  ///
  /// let promise = JSPromise(in: .current()) { continuation in
  ///   Task {
  ///     do {
  ///       continuation.resume(
  ///         resolving: JSValue(int32: try await calc(), in: continuation.context)
  ///       )
  ///       // 🔴 Has no effect.
  ///       continuation.resume(
  ///         resolving: JSValue(int32: try await calc(), in: continuation.context)
  ///       )
  ///     } catch {
  ///       continuation.resume(rejecting: JSValue(object: "failed", in: continuation.context))
  ///     }
  ///   }
  /// }
  /// ```
  ///
  /// - Parameters:
  ///   - context: The context to create this promise in.
  ///   - fn: A unit of work that reports its result to the ``Continuation``.
  public init(in context: JSContext, perform fn: (Continuation) -> Void) {
    let continuation = Continuation(context: context)
    fn(continuation)
    self.transfer = UnsafeJSValueTransfer(value: continuation.value)
  }
}

extension JSPromise.Continuation {
  private final class Storage: Sendable {
    private typealias State = (
      value: JSValue, resolve: JSValue?, reject: JSValue?, isResumed: Bool
    )
    private let state: Lock<State>

    var context: JSContext { self.state.withLock { $0.value.context } }
    var value: JSValue { self.state.withLock { $0.value } }

    init(context: JSContext) {
      self.state = Lock((JSValue(), nil, nil, false))
      self.state.withLock { state in
        withoutActuallyEscaping(
          { (resolve: JSValue?, reject: JSValue?) -> Void in
            state.resolve = resolve
            state.reject = reject
          },
          do: { state.value = JSValue(newPromiseIn: context, fromExecutor: $0) }
        )
      }
    }

    func resume(resolving value: Any?) {
      self.state.withLock {
        _ = $0.resolve?.call(withArguments: self.formStateResume(&$0, value: value))
      }
    }

    func resume(rejecting value: Any?) {
      self.state.withLock {
        _ = $0.reject?.call(withArguments: self.formStateResume(&$0, value: value))
      }
    }

    private func formStateResume(_ state: inout State, value: Any?) -> [Any] {
      state.isResumed = true
      var args = [Any]()
      if let value {
        args.append(value)
      }
      return args
    }
  }
}

// MARK: - Instance Methods

extension JSPromise {
  /// Invokes the `.then` method of the underlying Javascript Promise value.
  ///
  /// See the [MDN Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then) for more.
  ///
  /// - Parameters:
  ///   - fn: A function to asynchronously execute when this promise becomes fulfilled.
  ///   - onRejected: A function to asynchronously execute when this promise becomes rejected.
  /// - Returns: A new Promise.
  @discardableResult
  public func then(
    perform fn: @convention(block) @Sendable @escaping (JSValue) -> Any?,
    onRejected: (@convention(block) @Sendable (JSValue) -> Any?)? = nil
  ) -> Self {
    var args = [unsafeBitCast(fn, to: JSValue.self)]
    if let onRejected {
      args.append(unsafeBitCast(onRejected, to: JSValue.self))
    }
    return Self(self.value.invokeMethod("then", withArguments: args))
  }

  /// Invokes the `.catch` method of the underlying Javascript Promise value.
  ///
  /// See the [MDN Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch) for more.
  ///
  /// - Parameter fn: A function to asynchronously execute when this promise becomes rejected.
  /// - Returns: A new Promise.
  @discardableResult
  public func `catch`(
    perform fn: @convention(block) @Sendable @escaping (JSValue) -> Any?
  ) -> Self {
    Self(self.value.invokeMethod("catch", withArguments: [unsafeBitCast(fn, to: JSValue.self)]))
  }

  /// Invokes the `.finally` method of the underlying Javascript Promise value.
  ///
  /// See the [MDN Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/finally) for more.
  ///
  /// - Parameter fn: A function to asynchronously execute when this promise becomes settled.
  /// - Returns: A new Promise.
  @discardableResult
  public func finally(
    perform fn: @convention(block) @Sendable @escaping () -> Void
  ) -> Self {
    Self(self.value.invokeMethod("finally", withArguments: [unsafeBitCast(fn, to: JSValue.self)]))
  }
}

// MARK: - JSPromiseRejectedError

/// An error thrown by a rejected ``JSPromise``.
public struct JSPromiseRejectedError: Error {
  /// The reason for why this promise was rejected.
  public let reason: JSValue

  /// Creates a promise rejection error.
  ///
  /// - Parameter reason: The reason why the promise was rejected.
  public init(reason: JSValue) {
    self.reason = reason
  }
}

// MARK: - JSValue

extension JSValue {
  /// This value as a ``JSPromise``.
  public func toPromise() -> JSPromise? {
    JSPromise(value: self)
  }
}
