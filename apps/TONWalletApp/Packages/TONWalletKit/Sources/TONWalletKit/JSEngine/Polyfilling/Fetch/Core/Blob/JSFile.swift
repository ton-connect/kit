import JavaScriptCore
//@preconcurrency private import _CJavaScriptCoreExtras

// MARK: - JSFile

@objc private protocol JSFileExport: JSExport {
    var name: String { get }
    var webkitRelativePath: String { get }
    var lastModified: Int64 { get }
    var lastModifiedDate: Date { get }
    var size: Int64 { get }
    var type: String { get }
    
    init?(_ fileBits: JSValue, _ fileName: JSValue, _ options: JSValue)
    
    func text() -> JSValue
    func bytes() -> JSValue
    func arrayBuffer() -> JSValue
    func slice(_ start: JSValue, _ end: JSValue, _ type: JSValue) -> JSBlob
}

/// A class implementing Javascript's `File` class.
///
/// > Note: The Objective C class name of this class is `File` instead of `JSFile`. This is to
/// > ensure that JavaScriptCore recognizes the constructor name as `"File"` instead of `"JavaScriptCoreExtras.JSFile"`.
///
/// See the [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/File).
@objc(File) open class JSFile: JSBlob {
    /// The name of this file.
    public let name: String
    
    /// The date this file was last modified.
    public let lastModifiedDate: Date
    
    /// The `URL` of this file if it was not initialized through Javascript.
    public let url: URL?
    
    /// Creates a file from the contents of the specified `URL`.
    ///
    /// The direct contents of the file are only read when retrieving the bytes directly, and are not
    /// read in this initializer.
    ///
    /// - Parameter url: The `URL` of the file.
    @available(iOS 14, macOS 11, tvOS 14, watchOS 7, visionOS 1, *)
    public convenience init(contentsOf url: URL) throws {
        try self.init(contentsOf: url, type: MIMEType(of: url) ?? .empty)
    }
    
    /// Creates a file from the contents of the specified `URL` and `MIMEType`.
    ///
    /// The direct contents of the file are only read when retrieving the bytes directly, and are not
    /// read in this initializer.
    ///
    /// - Parameters:
    ///   - url: The `URL` of the file.
    ///   - type: The `MIMEType` of the file.
    public init(contentsOf url: URL, type: MIMEType) throws {
        let storage = try FileJSBlobStorage(url: url)
        self.lastModifiedDate = storage.lastModified
        self.name = url.lastPathComponent
        self.url = url
        super.init(storage: storage, type: type)
    }
    
    /// The canonical Javascript initializer for a `File`.
    ///
    /// See the [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/File/File).
    public required convenience init?(
        _ fileBits: JSValue,
        _ fileName: JSValue,
        _ options: JSValue
    ) {
        guard let context = JSContext.current(), let args = JSContext.currentArguments() else {
            return nil
        }
        guard args.count >= 2 else {
            context.exception = .constructError(
                className: "File",
                message: "2 arguments required, but only \(args.count) present.",
                in: context
            )
            return nil
        }
        guard options.isUndefined || options.isObject else {
            context.exception = .constructError(
                className: "File",
                message: "The provided value is not of type 'FilePropertyBag'.",
                in: context
            )
            return nil
        }
        let file = fileBits.toObjectOf(JSFile.self) as? JSFile
        var lastModified = Date()
        let jsLastModified =
        options.isUndefined ? nil : options.objectForKeyedSubscript("lastModified")
        if let date = jsLastModified?.toDate(), jsLastModified?.isDate == true {
            lastModified = date
        } else if let dateMillis = jsLastModified?.toInt32(), jsLastModified?.isNumber == true {
            lastModified = Date(timeIntervalSince1970: Double(dateMillis) / 1000)
        } else if let file {
            lastModified = file.lastModifiedDate
        }
        if let file {
            self.init(
                name: fileName.isUndefined ? file.name : fileName.toString(),
                date: lastModified,
                blob: file
            )
        } else if let blob = fileBits.toObjectOf(JSBlob.self) {
            self.init(
                name: fileName.isUndefined ? "blob" : fileName.toString(),
                date: lastModified,
                blob: blob as! JSBlob
            )
        } else if fileBits.isIterable && !fileBits.isString,
                  let blob = JSBlob(blobParts: fileBits, options: options)
        {
            // TODO: - Why does using super.init(iterable:options:) make the name and lastModified of this class blank?
            self.init(name: fileName.toString(), date: lastModified, blob: blob)
        } else {
            context.exception = .constructError(
                className: "File",
                message: "The provided value cannot be converted to a sequence.",
                in: context
            )
            return nil
        }
    }
    
    /// The canonical Javascript initializer for a `File`.
    ///
    /// See the [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/File/File).
    public required convenience init?(blobParts: JSValue, options: JSValue) {
        let args = JSContext.currentArguments().compactMap { $0 as? JSValue }
        self.init(blobParts, options, args.count > 2 ? args[2] : JSValue(undefinedIn: .current()))
    }
    
    private init(name: String, date: Date, blob: JSBlob) {
        self.name = name
        self.lastModifiedDate = date
        self.url = nil
        super.init(blob: blob)
    }
}

// MARK: - JSFileExport Conformance

extension JSFile: JSFileExport {
    /// An integer unix epoch timestamp in milliseconds of the last modification date of this file.
    public var lastModified: Int64 {
        Int64(round(self.lastModifiedDate.timeIntervalSince1970 * 1000))
    }
    
    public var webkitRelativePath: String { "" }
}

// MARK: - FileJSBlobStorage

private struct FileJSBlobStorage: JSBlobStorage {
    let lastModified: Date
    let utf8SizeInBytes: Int64
    private let url: URL
    
    init(url: URL) throws {
        let values = try url.resourceValues(forKeys: [.contentModificationDateKey, .fileSizeKey])
        self.utf8SizeInBytes = Int64(values.fileSize ?? 0)
        self.lastModified = values.contentModificationDate ?? Date()
        self.url = url
    }
    
    func utf8Bytes(
        startIndex: Int64,
        endIndex: Int64,
        context: JSContext
    ) throws(JSValueError) -> String.UTF8View {
        do {
            let data = try NSFileCoordinator()
                .coordinate(readingItemAt: self.url) { url in
                    let handle = try JSCoreExtrasFileHandle(url: url)
                    return try handle.read(
                        fromOffset: UInt64(startIndex),
                        count: UInt64(endIndex - startIndex)
                    )
                }
            // Remove this
            return String(decoding: data ?? Data(), as: UTF8.self).utf8
        } catch {
            throw JSValueError(
                value: JSValue(newErrorFromMessage: error.localizedDescription, in: context)
            )
        }
    }
}

// MARK: - Installer

public struct JSFileInstaller: JSContextInstallable, Sendable {
    public func install(in context: JSContext) throws {
        try context.install([.blob])
        context.setObject(JSFile.self, forPath: "File")
    }
}

extension JSContextInstallable where Self == JSFileInstaller {
    /// An installable that installs the `File` class.
    public static var jsFileClass: Self { JSFileInstaller() }
}
