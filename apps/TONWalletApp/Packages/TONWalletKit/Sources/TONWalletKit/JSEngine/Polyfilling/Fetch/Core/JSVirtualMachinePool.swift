@preconcurrency import JavaScriptCore

// MARK: - JSVirtualMachinePool

/// A class that manages a pool of `JSVirtualMachine`s that can be shared amongst `JSContext`s.
///
/// Each `JSVirtualMachine` is allocated a JS Heap, and performs garbage collection. For
/// applications with few `JSContext` instances, it can be appropriate to create separate
/// `JSVirtualMachine`s for each `JSContext` instance.
///
/// However, this can create a large resource overhead for applications with many `JSContext`
/// instances. Instead, applications with many contexts will want to share a virtual machine
/// between those contexts, but sharing a single virtual machine shared amongst many contexts
/// prevents those contexts from running JS code concurrently.
///
/// This class exists as a mechanism for sharing a pool of `JSVirtualMachine`s with multiple
/// `JSContext`s in order to achieve a balance between concurrent execution and limited resource
/// overhead. You can call ``virutalMachine`` on the pool to get a virtual machine instance to
/// create a `JSContext`. Virtual machines are created lazily, and are delegated round-robin
/// style.
public final class JSVirtualMachinePool: @unchecked Sendable {
  fileprivate typealias State = (
    index: Int, count: Int, machines: UnsafeMutablePointer<JSVirtualMachine?>
  )

  private let vm: (@Sendable () -> JSVirtualMachine)?
  private let condition = NSCondition()
  private let state: Lock<State>
  private var isCreatingMachineCondition = false

  /// Creates a virutal machine pool.
  ///
  /// - Parameters:
  ///   - count: The maximum number of virtual machines to contain in the pool.
  ///   - vm: A function to create a custom virtual machine that is called every time the pool creates a new `JSVirtualMachine`.
  public init(
    machines count: Int,
    vm: (@Sendable () -> JSVirtualMachine)? = nil
  ) {
    precondition(count > 0, "There must be a minimum of at least 1 virtual machine in the pool.")
    self.vm = vm
    self.state = Lock((index: 0, count: count, machines: .allocate(capacity: count)))
  }

  deinit {
    self.state.withLock { $0.machines.deallocate() }
  }
}

// MARK: - Accessing a Virtual Machine

extension JSVirtualMachinePool {
  /// Returns a `JSVirutalMachine` from this pool.
  ///
  /// The virtual machine returned is picked round-robin style.
  ///
  /// - Returns: A `JSVirutalMachine`.
  public func virtualMachine() async -> JSVirtualMachine {
    let transfer = self.state.withLock { state -> UnsafeJSVirtualMachineTransfer? in
      guard let vm = state.machines[state.index] else { return nil }
      state.index = self.nextVMIndex(in: state)
      return UnsafeJSVirtualMachineTransfer(vm: vm)
    }
    if let transfer {
      return transfer.vm
    }
    return await withUnsafeContinuation { continuation in
      self.condition.lock()
      while self.isCreatingMachineCondition {
        self.condition.wait()
      }
      self.state.withLock { state in
        if let vm = state.machines[state.index] {
          continuation.resume(returning: vm)
          state.index = self.nextVMIndex(in: state)
          self.condition.signal()
        } else {
          self.isCreatingMachineCondition = true
          Thread.detachNewThread {
            self.condition.lock()
            let vm = self.state.withLock { state in
              let vm = self.vm?() ?? JSVirtualMachine()!
              state.machines[state.index] = vm
              state.index = self.nextVMIndex(in: state)
              return vm
            }
            continuation.resume(returning: vm)
            self.isCreatingMachineCondition = false
            self.condition.signal()
            self.condition.unlock()
          }
        }
      }
      self.condition.unlock()
    }
  }

  private func nextVMIndex(in state: State) -> Int {
    var index = state.index
    while state.machines[index] != nil {
      index = (index + 1) % state.count
      if state.index == index {
        return (state.index + 1) % state.count
      }
    }
    return index
  }
}

// MARK: - Garbage Collection

extension JSVirtualMachinePool {
  /// Frees any virtual machines from the pool that are not referenced by another object.
  public func garbageCollect() {
    self.state.withLock { state in
      for i in 0..<state.count {
        if isKnownUniquelyReferenced(&state.machines[i]) {
          state.machines[i] = nil
        }
      }
    }
  }
}

// MARK: - Helpers

private struct UnsafeJSVirtualMachineTransfer: @unchecked Sendable {
  let vm: JSVirtualMachine
}
