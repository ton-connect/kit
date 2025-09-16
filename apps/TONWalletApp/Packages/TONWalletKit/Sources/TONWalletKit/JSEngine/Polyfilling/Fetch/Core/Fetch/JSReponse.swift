import JavaScriptCore

public struct JSResponseInstaller: JSContextInstallable {
  private let base = combineInstallers([
    .formData, .headers,
    .jsCoreExtrasBundled(path: "HTTPBody.js"),
    .jsCoreExtrasBundled(path: "HTTPOptions.js"),
    .jsCoreExtrasBundled(path: "Response.js")
  ])

  public func install(in context: JSContext) throws {
    try self.base.install(in: context)
  }
}

extension JSContextInstallable where Self == JSResponseInstaller {
  /// An installable that installs Javascript's `Response` class.
  public static var response: Self { JSResponseInstaller() }
}
