import Foundation

extension URL {
  /// Whether or not this URL has an HTTP or HTTPS scheme.
  var hasHTTPScheme: Bool {
    self.scheme == "http" || self.scheme == "https"
  }
}
