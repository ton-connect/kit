import Foundation
import UniformTypeIdentifiers

// MARK: - MIMEType

/// A data type representing a MIME type.
public struct MIMEType: RawRepresentable, Hashable, Sendable, Codable {
  public let rawValue: String

  public init(rawValue: String) {
    self.rawValue = rawValue
  }
}

// MARK: - ExpressibleByStringLiteral

extension MIMEType: ExpressibleByStringLiteral {
  public init(stringLiteral value: StringLiteralType) {
    self.init(rawValue: value)
  }
}

// MARK: - Of URL Init

extension MIMEType {
  /// Attempts to create a mime type by using the path extension of a `URL`.
  ///
  /// This initializer returns nil if the URL is a directory URL, or not a filesystem URL.
  ///
  /// - Parameter url: A filesystem `URL`.
  @available(iOS 14, macOS 11, tvOS 14, watchOS 7, visionOS 1, *)
  public init?(of url: URL) {
    guard !url.hasDirectoryPath && url.isFileURL else { return nil }
    if let identifier = UTType(filenameExtension: url.pathExtension)?.preferredMIMEType {
      self.init(rawValue: identifier)
    } else {
      self = .octetStream
    }
  }
}

// MARK: - MIME Types

extension MIMEType {
  public static let empty: Self = ""
  public static let zipArchive: Self = "application/zip"
  public static let text: Self = "text/plain"
  public static let png: Self = "image/png"
  public static let jpeg: Self = "image/jpeg"
  public static let html: Self = "text/html"
  public static let pdf: Self = "application/pdf"
  public static let xml: Self = "application/xml"
  public static let json: Self = "application/json"
  public static let octetStream: Self = "application/octet-stream"
}
