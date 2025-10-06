import JavaScriptCore

// MARK: - JSContextInstallable

/// A protocol for installing functionallity into a `JSContext`.
public protocol JSContextInstallable {
  /// Installs the functionallity of this installable into the specified context.
  ///
  /// - Parameter context: The `JSContext` to install the functionallity to.
  func install(in context: JSContext) throws
}

// MARK: - Install

extension JSContext {
  fileprivate static let installLock = NSRecursiveLock()

  /// Installs the specified installables to this context.
  ///
  /// - Parameter installables: A list of ``JSContextInstallable``s.
  public func install(_ installables: [any JSContextInstallable]) throws {
    try Self.installLock.withLock {
      self.setObject(JSValue(privateSymbolIn: self), forPath: "Symbol._jsCoreExtrasPrivate")
      for installable in [.jsCoreExtrasBundled(path: "Utils.js")] + installables {
        try installable.install(in: self)
      }
    }
  }
}

// MARK: - Deduplicate

extension JSContextInstallable where Self: Identifiable {
  /// Ensures this installable only gets installed once per `JSContext` based on its unique
  /// `id` property.
  ///
  /// The `id` property of this installable is used to detect if it has been installed on a
  /// particular `JSContext`. The `JSContext` stores a list of all installed ids, and will not
  /// install this installable if the context's list contains this installble's id.
  ///
  /// - Returns: An installable.
  public func deduplicated() -> _DeduplicatedInstallable<Self> {
    _DeduplicatedInstallable(base: self)
  }
}

public struct _DeduplicatedInstallable<
  Base: JSContextInstallable & Identifiable
>: JSContextInstallable {
  private let base: Base

  fileprivate init(base: Base) {
    self.base = base
  }

  public func install(in context: JSContext) throws {
    try JSContext.installLock.withLock {
      guard !context.installedIds.contains(self.base.id) else { return }
      try self.base.install(in: context)
      context.installedIds.insert(self.base.id)
    }
  }
}

extension _DeduplicatedInstallable: Sendable where Base: Sendable {}

extension JSContext {
  private static nonisolated(unsafe) let installIdsKey = malloc(1)!
  fileprivate var installedIds: Set<AnyHashable> {
    get {
      objc_getAssociatedObject(self, Self.installIdsKey) as? Set<AnyHashable> ?? []
    }
    set {
      objc_setAssociatedObject(
        self,
        Self.installIdsKey,
        newValue,
        .OBJC_ASSOCIATION_RETAIN_NONATOMIC
      )
    }
  }
}

// MARK: - Combine

/// Returns an installer that combines a specified array of installers into a single installer.
///
/// - Parameter installers: An array of ``JSContextInstallable`` instances.
/// - Returns: A ``CombinedJSContextInstallable``.
public func combineInstallers(
  _ installers: [any JSContextInstallable]
) -> CombinedJSContextInstallable {
  CombinedJSContextInstallable(installers: installers)
}

/// An installable that combines an array of ``JSContextInstallable``s into a single installer.
public struct CombinedJSContextInstallable: JSContextInstallable {
  let installers: [any JSContextInstallable]

  public func install(in context: JSContext) throws {
    try context.install(self.installers)
  }
}

// MARK: - AnyJSInstaller

/// A type-erased ``JSContextInstallable``.
public struct AnyJSInstaller: JSContextInstallable {
  private let install: (JSContext) throws -> Void

  /// Creates an installer from the specified closure that installs Javascript into a `JSContext`.
  public init(install: @escaping (JSContext) throws -> Void) {
    self.install = install
  }

  /// Type-erases an installer.
  public init(_ installer: some JSContextInstallable) {
    self.install = installer.install(in:)
  }

  public func install(in context: JSContext) throws {
    try self.install(context)
  }
}

// MARK: - Bundle JS Context Installable

/// A ``JSContextInstallable`` that loads Javascript files from a bundle.
public struct BundleFileJSContextInstaller: JSContextInstallable, Sendable {
  private let inner: _DeduplicatedInstallable<Inner>

  init(path: String, bundle: Bundle) {
    self.inner = Inner(path: path, bundle: bundle).deduplicated()
  }

  public func install(in context: JSContext) throws {
    try self.inner.install(in: context)
  }
}

extension BundleFileJSContextInstaller {
  private struct Inner: Identifiable, Hashable, JSContextInstallable, Sendable {
    let path: String
    let bundle: Bundle

    var id: Self { self }

    func install(in context: JSContext) throws {
      guard let url = self.bundle.url(forResource: self.path, withExtension: nil) else {
        throw URLError(.fileDoesNotExist)
      }
      context.evaluateScript(try String(contentsOf: url), withSourceURL: url)
    }
  }
}

extension JSContextInstallable where Self == BundleFileJSContextInstaller {
  /// An installable that loads the contents of the specified bundle pats relative to a `Bundle`.
  ///
  /// - Parameters:
  ///   - bundlePaths: A paths relative to a `Bundle`.
  ///   - bundle: The `Bundle` to load from (defaults to the main bundle).
  /// - Returns: An installable.
  public static func bundled(path bundlePath: String, in bundle: Bundle = .main) -> Self {
    BundleFileJSContextInstaller(path: bundlePath, bundle: bundle)
  }

  static func jsCoreExtrasBundled(path bundledPath: String) -> Self {
    .bundled(path: bundledPath, in: .module)
  }
}

// MARK: - FilesJSContextInstallable

/// A ``JSContextInstallable`` that loads Javascript code from a list of `URL`s.
public struct FilesJSContextInstallable: JSContextInstallable {
  let urls: [URL]

  public func install(in context: JSContext) throws {
    for url in urls {
      context.evaluateScript(try String(contentsOf: url), withSourceURL: url)
    }
  }
}

extension JSContextInstallable where Self == FilesJSContextInstallable {
  /// An installable that installs the code at the specified `URL`.
  ///
  /// - Parameter url: The file `URL` of the JS code.
  /// - Returns: An installable.
  public static func file(at url: URL) -> Self {
    Self(urls: [url])
  }

  /// An installable that installs the code at the specified `URL`s.
  ///
  /// - Parameter urls: The file `URL`s of the JS code.
  /// - Returns: An installable.
  public static func files(at urls: [URL]) -> Self {
    Self(urls: urls)
  }
}

// MARK: - DOMException

public struct JSDOMExceptionInstaller: JSContextInstallable {
  private let base = BundleFileJSContextInstaller.jsCoreExtrasBundled(path: "DOMException.js")

  public func install(in context: JSContext) throws {
    try self.base.install(in: context)
  }
}

extension JSContextInstallable where Self == JSDOMExceptionInstaller {
  /// An installable that installs the `DOMException` class.
  public static var domException: Self { JSDOMExceptionInstaller() }
}

// MARK: - Headers

public struct JSHeadersInstaller: JSContextInstallable {
  private let base = BundleFileJSContextInstaller.jsCoreExtrasBundled(path: "Headers.js")

  public func install(in context: JSContext) throws {
    try self.base.install(in: context)
  }
}

extension JSContextInstallable where Self == JSHeadersInstaller {
  /// An installable that installs the `Headers` class.
  public static var headers: Self { JSHeadersInstaller() }
}

// MARK: - FormData

public struct JSFormDataInstaller: JSContextInstallable {
  private let base = combineInstallers([
    .jsFileClass,
    .jsCoreExtrasBundled(path: "FormData.js")
  ])

  public func install(in context: JSContext) throws {
    try self.base.install(in: context)
  }
}

extension JSContextInstallable where Self == JSFormDataInstaller {
  /// An installable that installs the `FormData` class.
  public static var formData: Self { JSFormDataInstaller() }
}
