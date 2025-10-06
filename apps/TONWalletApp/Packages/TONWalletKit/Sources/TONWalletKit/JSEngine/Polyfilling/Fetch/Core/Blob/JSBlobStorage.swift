import JavaScriptCore

// MARK: - JSBlobStorage

/// A protocol that allows the creation of ``JSBlob`` by using an arbitrary source of bytes such
/// as a file.
public protocol JSBlobStorage: Sendable {
    /// The size (in bytes) of the stored UTF8 content.
    var utf8SizeInBytes: Int64 { get }
    
    /// Returns the stored UTF8 bytes.
    ///
    /// - Parameters:
    ///   - startIndex: The starting index in the UTF8 data.
    ///   - endIndex: The ending index in the UTF8 data.
    ///   - context: The `JSContext` of the blob fetching bytes.
    /// - Throws: A ``JSValueError``.
    /// - Returns: UTF8 data.
    func utf8Bytes(
        startIndex: Int64,
        endIndex: Int64,
        context: JSContext
    ) async throws(JSValueError) -> String.UTF8View
}

// MARK: - String Conformances

extension String: JSBlobStorage {
    public func utf8Bytes(
        startIndex: Int64,
        endIndex: Int64,
        context: JSContext
    ) -> String.UTF8View {
        self.utf8.utf8Bytes(startIndex: startIndex, endIndex: endIndex, context: context)
    }
}

extension Substring: JSBlobStorage {
    public func utf8Bytes(
        startIndex: Int64,
        endIndex: Int64,
        context: JSContext
    ) -> String.UTF8View {
        self.utf8.utf8Bytes(startIndex: startIndex, endIndex: endIndex, context: context)
    }
}

extension StringProtocol where Self: JSBlobStorage {
    public var utf8SizeInBytes: Int64 { Int64(self.utf8.count) }
}

extension String.UTF8View: JSBlobStorage {
    public var utf8SizeInBytes: Int64 { Int64(self.count) }
    
    public func utf8Bytes(startIndex: Int64, endIndex: Int64, context: JSContext) -> Self {
        self[self.startIndex..<self.endIndex]
            .utf8Bytes(startIndex: startIndex, endIndex: endIndex, context: context)
    }
}

extension Substring.UTF8View: JSBlobStorage {
    public var utf8SizeInBytes: Int64 { Int64(self.count) }
    
    public func utf8Bytes(
        startIndex: Int64,
        endIndex: Int64,
        context: JSContext
    ) -> String.UTF8View {
        guard startIndex >= 0 && endIndex >= startIndex else {
            return String(self)?.utf8 ?? "".utf8
        }
        
        guard startIndex < self.count && endIndex <= self.count else {
            return String(self)?.utf8 ?? "".utf8
        }
        
        let startIndex = self.index(self.startIndex, offsetBy: Int(startIndex))
        let endIndex = self.index(self.startIndex, offsetBy: Int(endIndex))
        return String(Substring(self[startIndex..<endIndex])).utf8
    }
}
