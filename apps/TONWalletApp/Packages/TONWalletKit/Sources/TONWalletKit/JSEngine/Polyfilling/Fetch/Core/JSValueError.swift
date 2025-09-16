@preconcurrency import JavaScriptCore

/// An error containing a thrown `JSValue`.
public struct JSValueError: Error {
  /// The `JSValue` to throw.
  public let value: JSValue

  /// Creates a value error.
  ///
  /// - Parameter reason: The `JSValue` to throw.
  public init(value: JSValue) {
    self.value = value
  }
}
