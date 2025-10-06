import Foundation

// MARK: - Reading

extension NSFileCoordinator {
  func coordinate<T>(
    readingItemAt url: URL,
    options: NSFileCoordinator.ReadingOptions = [],
    byAccessor: (URL) throws -> T
  ) throws -> T {
    try self.coordinate { pointer, state in
      self.coordinate(readingItemAt: url, error: pointer) { url in
        state.perform { try byAccessor(url) }
      }
    }
  }
}

// MARK: - Helper

private struct CoordinateState<T> {
  private(set) var value: T?
  private(set) var error: (any Error)?

  mutating func perform(_ work: () throws -> T) {
    do {
      self.value = try work()
    } catch {
      self.error = error
    }
  }
}

extension NSFileCoordinator {
  private func coordinate<T>(
    _ coordinate: (NSErrorPointer, inout CoordinateState<T>) throws -> Void
  ) throws -> T {
    var state = CoordinateState<T>()
    var coordinatorError: NSError?
    try coordinate(&coordinatorError, &state)
    if let error = coordinatorError ?? state.error {
      throw error
    }
    return state.value!
  }
}
