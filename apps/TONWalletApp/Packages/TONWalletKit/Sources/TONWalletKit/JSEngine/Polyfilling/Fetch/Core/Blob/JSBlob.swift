@preconcurrency import JavaScriptCore

// MARK: - JSBlob

@objc private protocol JSBlobExport: JSExport {
  var size: Int64 { get }
  var type: String { get }

  init?(blobParts iterable: JSValue, options: JSValue)

  func text() -> JSValue
  func bytes() -> JSValue
  func arrayBuffer() -> JSValue

  func slice(_ start: JSValue, _ end: JSValue, _ type: JSValue) -> JSBlob
}

/// A class representing a Javascript `Blob`.
///
/// > Note: The Objective C class name of this class is `Blob` instead of `JSBlob`. This is to
/// > ensure that JavaScriptCore recognizes the constructor name as `"Blob"` instead of `"JavaScriptCoreExtras.JSBlob"`.
///
/// You can create blobs through Javascript, but also by leveraging the ``JSBlobStorage``
/// protocol which allows you to create a blob with bytes from an arbitrary source such as a file.
@objc(Blob) open class JSBlob: NSObject {
  /// The `MIMEType` of this blob.
  public let mimeType: MIMEType

  private let indexedStorage: IndexedStorage

  /// Creates a blob using its Javascript initializer.
  ///
  /// See [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/Blob/Blob).
  public required convenience init?(blobParts iterable: JSValue, options: JSValue) {
    guard let context = JSContext.current() else { return nil }
    let type = options.isUndefined ? "" : options.objectForKeyedSubscript("type").toString() ?? ""
    guard iterable.isUndefined || (iterable.isIterable && !iterable.isString) else {
      context.exception = .constructError(
        className: "Blob",
        message: "The provided value cannot be converted to a sequence.",
        in: context
      )
      return nil
    }
    guard !iterable.isUndefined else {
      self.init(storage: "", type: MIMEType(rawValue: type))
      return
    }
    let map: @convention(block) (JSValue) -> String = { $0.toString() }
    let strings = context.objectForKeyedSubscript("Array")
      .invokeMethod("from", withArguments: [iterable])
      .invokeMethod("map", withArguments: [unsafeBitCast(map, to: JSValue.self)])
      .toArray()
      .compactMap { $0 as? String }
    self.init(storage: strings.joined(), type: MIMEType(rawValue: type))
  }

  /// Creates a blob from another blob.
  ///
  /// - Parameter blob: Another blob.
  public init(blob: JSBlob) {
    self.mimeType = blob.mimeType
    self.indexedStorage = blob.indexedStorage
  }

  /// Creates a blob from a backing ``JSBlobStorage`` and `MIMEType`.
  ///
  /// ```swift
  /// let blob = JSBlob(storage: "Hello world!", type: .text)
  /// ```
  ///
  /// - Parameters:
  ///   - storage: A ``JSBlobStorage``.
  ///   - type: A `MIMEType`.
  public init(storage: some JSBlobStorage, type: MIMEType) {
    self.mimeType = type
    self.indexedStorage = IndexedStorage(
      startIndex: 0,
      endIndex: storage.utf8SizeInBytes,
      storage: storage
    )
  }

  private init(state: IndexedStorage, type: MIMEType) {
    self.indexedStorage = state
    self.mimeType = type
  }
}

// MARK: - Subscript

extension JSBlob {
  public subscript(range: Range<Int64>, type mimeType: MIMEType? = nil) -> JSBlob {
    var state = self.indexedStorage
    state.startIndex = range.lowerBound
    state.endIndex = range.upperBound
    return JSBlob(state: state, type: mimeType ?? self.mimeType)
  }

  public subscript(range: PartialRangeFrom<Int64>, type mimeType: MIMEType? = nil) -> JSBlob {
    var state = self.indexedStorage
    state.startIndex = range.lowerBound
    state.endIndex = self.size
    return JSBlob(state: state, type: mimeType ?? self.mimeType)
  }
}

// MARK: - UTF8

extension JSBlob {
  /// Returns the UTF8 view from this blob.
  public func utf8(context: JSContext) async throws -> String.UTF8View {
    try await self.indexedStorage.utf8(context: context)
  }
}

// MARK: - JSExport Conformance

extension JSBlob: JSBlobExport {
  /// The mime type as a raw string.
  public var type: String {
    self.mimeType.rawValue
  }

  /// The size (in bytes) of this blob.
  public var size: Int64 {
    self.indexedStorage.storage.utf8SizeInBytes
  }

  /// Returns the text of this blob as a `JSValue`.
  public func text() -> JSValue {
    self.utf8Promise { utf8, _ in String(utf8) }.value
  }

  /// Returns the bytes of this blob as a `JSValue`.
  public func bytes() -> JSValue {
    self.utf8Promise { bufferWithBytes(utf8: $0, in: $1).1 }.value
  }

  /// Returns a Javascript `ArrayBuffer` of this blob as a `JSValue`.
  public func arrayBuffer() -> JSValue {
    self.utf8Promise { bufferWithBytes(utf8: $0, in: $1).0 }.value
  }

  /// The implementation of Javascript's `Blob.slice`.
  public func slice(_ start: JSValue, _ end: JSValue, _ type: JSValue) -> JSBlob {
    let type = MIMEType(rawValue: type.isUndefined ? self.type : type.toString() ?? "")
    guard !start.isUndefined else { return self }
    let start = max(0, Int64(start.toInt32()))
    guard !end.isUndefined else { return self[start..., type: type] }
    let end = min(self.size, end.isUndefined ? self.size : Int64(end.toInt32()))
    return self[start..<end, type: type]
  }

  private func utf8Promise(
    _ map: @Sendable @escaping (String.UTF8View, JSContext) -> Any?
  ) -> JSPromise {
    JSPromise(in: .current()) { continuation in
      let indexedStorage = self.indexedStorage
      Task { await indexedStorage.utf8(continuation: continuation, map) }
    }
  }
}

// MARK: - Helpers

extension JSBlob {
  private struct IndexedStorage: Sendable {
    var startIndex: Int64
    var endIndex: Int64
    let storage: any JSBlobStorage

    func utf8(context: JSContext) async throws(JSValueError) -> String.UTF8View {
      try await self.storage.utf8Bytes(
        startIndex: self.startIndex,
        endIndex: self.endIndex,
        context: context
      )
    }

    func utf8(
      continuation: JSPromise.Continuation,
      _ map: (String.UTF8View, JSContext) -> Any?
    ) async {
      do {
        continuation.resume(
          resolving: map(try await self.utf8(context: continuation.context), continuation.context)
        )
      } catch {
        continuation.resume(rejecting: error.value)
      }
    }
  }
}

extension JSValue {
  fileprivate func consumeIterable() -> [String] {
    guard self.isObject else { return [] }
    guard let symbolIterator = self.context.evaluateScript("Symbol.iterator") else { return [] }
    guard
      let iteratorFunction = self.objectForKeyedSubscript(symbolIterator).call(withArguments: []),
      let iterator = iteratorFunction.call(withArguments: [])
    else { return [] }
    print(iterator)
    var results: [String] = []
    while true {
      guard let result = iterator.invokeMethod("next", withArguments: []) else { break }
      guard let done = result.forProperty("done")?.toBool() else { break }
      if done { break }
      if let value = result.forProperty("value") {
        results.append(value.toString())
      }
    }
    return results
  }
}

private func bufferWithBytes(
  utf8: String.UTF8View,
  in context: JSContext
) -> (JSValue, JSValue) {
  let bytes = context.objectForKeyedSubscript("Uint8Array")
    .construct(withArguments: [utf8.count])!
  for (index, byte) in utf8.enumerated() {
    bytes.setValue(byte, at: index)
  }
  return (bytes.objectForKeyedSubscript("buffer")!, bytes)
}

// MARK: - Blob Installer

public struct JSBlobInstaller: JSContextInstallable, Sendable {
  public func install(in context: JSContext) {
    context.setObject(JSBlob.self, forPath: "Blob")
  }
}

extension JSContextInstallable where Self == JSBlobInstaller {
  /// An installable that installs the Blob class.
  public static var blob: Self { JSBlobInstaller() }
}
