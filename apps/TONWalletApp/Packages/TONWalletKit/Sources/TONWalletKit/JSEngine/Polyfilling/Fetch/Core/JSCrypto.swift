import JavaScriptCore
import Security

// MARK: - Installer

public struct JSCryptoInstaller: JSContextInstallable {
  public func install(in context: JSContext) throws {
    let randomUUID: @convention(block) () -> String = { "\(UUID())".lowercased() }
    let randomBytes: @convention(block) (Int) -> [UInt8] = { self.randomBytes(count: $0) }
    context.setObject(randomUUID, forPath: "_jsCoreExtrasRandomUUID")
    context.setObject(randomBytes, forPath: "_jsCoreExtrasRandomBytes")
    try context.install([.jsCoreExtrasBundled(path: "Crypto.js")])
  }

  private func randomBytes(count: Int) -> [UInt8] {
    var bytes = [UInt8](repeating: 0, count: count)
    let result = SecRandomCopyBytes(kSecRandomDefault, count, &bytes)
    if result != errSecSuccess {
      let errorMessage =
        SecCopyErrorMessageString(result, nil) as? String ?? "Unknown Security Framework Error"
      JSContext.current()?.exception = JSValue(
        newErrorFromMessage: errorMessage,
        in: .current()
      )
    }
    return bytes
  }
}

extension JSContextInstallable where Self == JSCryptoInstaller {
  /// An installable that installs web browser crypto operations.
  ///
  /// `crypto.subtle` is not supported, only `crypto.getRandomValues` and `crypto.randomUUID`
  /// are supported.
  public static var crypto: Self { JSCryptoInstaller() }
}
