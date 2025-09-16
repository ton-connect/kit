@preconcurrency import JavaScriptCore

public struct JSAbortControllerInstaller: JSContextInstallable, Sendable {
  let sleep: @Sendable (TimeInterval) async throws -> Void

  public func install(in context: JSContext) throws {
    let timeout: @convention(block) (JSValue, TimeInterval) -> Void = { controller, time in
      let transfer = UnsafeJSValueTransfer(value: controller)
      Task { try await self.sleep(controller: transfer.value, time: time) }
    }
    context.setObject(timeout, forPath: "_jsCoreExtrasAbortSignalTimeout")
    try context.install([.domException, .jsCoreExtrasBundled(path: "AbortController.js")])
  }

  private func sleep(controller: JSValue, time: TimeInterval) async throws {
    try await self.sleep(time)
    let exception = controller.context.objectForKeyedSubscript("DOMException")
      .construct(withArguments: ["signal timed out", "TimeoutError"])!
    _ = controller.invokeMethod("abort", withArguments: [exception])
  }
}

extension JSContextInstallable where Self == JSAbortControllerInstaller {
  /// An installable that installs `AbortController` and `AbortSignal` functionallity.
  public static var abortController: Self {
    JSAbortControllerInstaller { interval in
      await withUnsafeContinuation { continuation in
        DispatchQueue.global()
          .asyncAfter(deadline: .now() + interval) {
            continuation.resume()
          }
      }
    }
  }

  /// An installable that installs `AbortController` and `AbortSignal` functionallity.
  ///
  /// - Parameter sleep: A function to sleep for a specified duration when `AbortSignal.timeout` is called.
  /// - Returns: An installable.
  public static func abortController(
    sleep: @Sendable @escaping (TimeInterval) async throws -> Void
  ) -> Self {
    JSAbortControllerInstaller(sleep: sleep)
  }
}
