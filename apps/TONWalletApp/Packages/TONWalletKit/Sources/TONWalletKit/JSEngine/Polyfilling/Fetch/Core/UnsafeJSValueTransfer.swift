import JavaScriptCore

/// A data type for passing `JSValue` across Sendable boundaries.
///
/// The JavaScriptCore API is thread-safe, but `JSValue` does not conform to Sendable because it
/// is an open class that can be subclassed. Therefore, this type exists as an honorary mechanism
/// to avoid Sendable errors with `JSValue`. Do not construct this type with a non-thread-safe
/// `JSValue` subclass instance.
public struct UnsafeJSValueTransfer: @unchecked Sendable {
  /// The `JSValue`.
  public let value: JSValue

  /// Creates a transfer.
  ///
  /// - Parameter value: A `JSValue`.
  public init(value: JSValue) {
    self.value = value
  }
}
