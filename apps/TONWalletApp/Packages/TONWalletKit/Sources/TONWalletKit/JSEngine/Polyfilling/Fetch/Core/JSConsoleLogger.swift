import JavaScriptCore

// MARK: - JSConsole

/// A protocol that implements Javascript's the `console.log` family of functions.
///
/// Conforming to this protocol installs the following functions:
/// - `console.log`
/// - `console.error`
/// - `console.info`
/// - `console.warn`
/// - `console.debug`
/// - `console.trace`
public protocol JSConsoleLogger: JSContextInstallable {
  /// Logs the specified message at the specified level.
  ///
  /// - Parameters:
  ///   - level: See ``JSConsoleLoggerLevel``.
  ///   - message: The message to log.
  func log(level: JSConsoleLoggerLevel?, message: String)
}

// MARK: - LogLevel

/// Logger levels supported by the console API in Javascript.
public enum JSConsoleLoggerLevel: Int, Hashable, Codable, Sendable {
  case trace = 0
  case debug = 1
  case info = 2
  case warn = 3
  case error = 4
}

// MARK: - Install

extension JSConsoleLogger {
  /// Installs the functions provided by this logger in a `JSContext`.
  ///
  /// This method installs the following functions:
  /// - `console.log`
  /// - `console.error`
  /// - `console.info`
  /// - `console.warn`
  /// - `console.debug`
  /// - `console.trace`
  ///
  /// - Parameter context: The `JSContext` to install the functions to.
  public func install(in context: JSContext) {
    let log: @convention(block) () -> Void = {
      self.log(level: nil, message: self.formattedArgs())
    }
    let info: @convention(block) () -> Void = {
      self.log(level: .info, message: self.formattedArgs())
    }
    let error: @convention(block) () -> Void = {
      self.log(level: .error, message: self.formattedArgs())
    }
    let warn: @convention(block) () -> Void = {
      self.log(level: .warn, message: self.formattedArgs())
    }
    let trace: @convention(block) () -> Void = {
      self.log(level: .trace, message: self.formattedArgs())
    }
    let debug: @convention(block) () -> Void = {
      self.log(level: .debug, message: self.formattedArgs())
    }
    context.setObject(log, forPath: "console.log")
    context.setObject(info, forPath: "console.info")
    context.setObject(error, forPath: "console.error")
    context.setObject(warn, forPath: "console.warn")
    context.setObject(trace, forPath: "console.trace")
    context.setObject(debug, forPath: "console.debug")
  }

  private func formattedArgs() -> String {
    let args = JSContext.currentArguments().compactMap { ($0 as? JSValue) }
    guard let firstArg = args.first else { return "undefined" }
    if firstArg.isString {
      return String(jsFormat: firstArg.toString(), args: Array(args.dropFirst()))
    } else {
      return args.map { $0.loggableString() }.joined(separator: " ")
    }
  }
}

// MARK: - PrintJSConsoleLogger

/// A ``JSConsoleLogger`` that prints to either stdout or stderr based on the log level.
public struct PrintJSConsoleLogger: JSConsoleLogger {
  public init() {}

  public func log(level: JSConsoleLoggerLevel?, message: String) {
    var stderr = FileTextOutputStream.stderr
    switch level {
    case .error: print(message, to: &stderr)
    default: print(message)
    }
  }
}

extension JSContextInstallable where Self == PrintJSConsoleLogger {
  /// An installable that installs `console.log`.
  ///
  /// The following functions are installed by this installable:
  /// - `console.log`
  /// - `console.error`
  /// - `console.info`
  /// - `console.warn`
  /// - `console.debug`
  /// - `console.trace`
  public static var consoleLogging: Self { PrintJSConsoleLogger() }
}

// MARK: - CombineJSLoggers

/// Combines an array of ``JSConsoleLogger``s into a single logger.
public func combineJSConsoleLoggers(_ loggers: [any JSConsoleLogger]) -> CombinedJSConsoleLogger {
  CombinedJSConsoleLogger(loggers: loggers)
}

/// A ``JSConsoleLogger`` that combines many loggers into a single logger.
///
/// You can create an instance of this logger by calling ``combineJSConsoleLoggers``.
public struct CombinedJSConsoleLogger: JSConsoleLogger {
  let loggers: [any JSConsoleLogger]

  public func log(level: JSConsoleLoggerLevel?, message: String) {
    for logger in self.loggers {
      logger.log(level: level, message: message)
    }
  }
}

// MARK: - Helpers

extension JSValue {
  fileprivate func loggableString(isNested: Bool = false) -> String {
    if self.isBoolean {
      return self.toBool() ? "true" : "false"
    } else if self.isUndefined {
      return "undefined"
    } else if self.isNull {
      return "null"
    } else if self.isString {
      return isNested ? "'\(self)'" : "\(self)"
    } else if self.isNumber {
      return "\(self.toNumber().description)"
    } else if self.isDate {
      return DateFormatter.jsString.string(from: self.toDate())
    } else if self.isArray {
      let strings = (0..<self.toArray().count)
        .map { self.atIndex($0).loggableString(isNested: true) }
        .joined(separator: ", ")
      return strings.isEmpty ? "[]" : "[ \(strings) ]"
    } else if self.isSet {
      let className = self.classConstructor?.functionName ?? "Set"
      let size = self.objectForKeyedSubscript("size").toInt32()
      guard size > 0 else { return "\(className)(0) {}" }
      var values = [JSValue]()
      let each: @convention(block) (JSValue) -> Void = {
        values.append($0)
      }
      self.invokeMethod("forEach", withArguments: [unsafeBitCast(each, to: JSValue.self)])
      return
        "\(className)(\(size)) { \(values.map { $0.loggableString(isNested: true) }.joined(separator: ", ")) }"
    } else if self.isMap {
      let className = self.classConstructor?.functionName ?? "Map"
      let size = self.objectForKeyedSubscript("size").toInt32()
      guard size > 0 else { return "\(className)(0) {}" }
      var values = [(key: JSValue, value: JSValue)]()
      let each: @convention(block) (JSValue, JSValue) -> Void = {
        values.append(($1, $0))
      }
      self.invokeMethod("forEach", withArguments: [unsafeBitCast(each, to: JSValue.self)])
      let mapStrings =
        values.map {
          "\($0.key.loggableString(isNested: true)) => \($0.value.loggableString(isNested: true))"
        }
        .joined(separator: ", ")
      return "\(className)(\(size)) { \(mapStrings) }"
    } else if self.isSymbol {
      return "Symbol"
    } else if self.isClassConstructor {
      return "[class \(self.functionName)]"
    } else if self.isFunction {
      return "[Function: \(self.functionName)]"
    } else if let constructor = self.classConstructor {
      let base = "class \(constructor.functionName) "
      return self.objectPropertiesString.isEmpty
        ? "\(base){}" : "\(base){ \(self.objectPropertiesString) }"
    } else {
      return self.objectPropertiesString.isEmpty ? "{}" : "{ \(self.objectPropertiesString) }"
    }
  }

  fileprivate var objectPropertiesString: String {
    (self.instanceVariableNames ?? [])
      .map { ($0, self.objectForKeyedSubscript($0)) }
      .map {
        "\($0.0.jsObjectKeyString): \($0.1?.loggableString(isNested: true) ?? "undefined")"
      }
      .joined(separator: ", ")
  }
}

extension JSValue {
  fileprivate var isSet: Bool {
    self.isInstanceOf(className: "Set")
  }

  fileprivate var isFunction: Bool {
    self.isInstanceOf(className: "Function")
  }

  fileprivate var isMap: Bool {
    self.isInstanceOf(className: "Map")
  }

  private func isInstanceOf(className: String) -> Bool {
    self.context.objectForKeyedSubscript(className).map { self.isInstance(of: $0) } ?? false
  }

  fileprivate var isClassConstructor: Bool {
    guard let prototype = self.objectForKeyedSubscript("prototype") else {
      return false
    }
    guard self.isFunction else { return false }
    guard let string = prototype.toString() else {
      // NB: Only Date's constructor seems to hit this case, should there be more checks here?
      return true
    }
    return self.functionName == "Function"
      || (!string.starts(with: "function") && string != "undefined")
  }

  fileprivate var classConstructor: JSValue? {
    self.objectForKeyedSubscript("constructor")
      .flatMap { $0.isClassConstructor && $0.functionName != "Object" ? $0 : nil }
  }

  fileprivate var functionName: String {
    guard let name = self.objectForKeyedSubscript("name").toString() else {
      return "(anonymous)"
    }
    return name.isEmpty ? "(anonymous)" : name
  }

  fileprivate var instanceVariableNames: [String]? {
    let names = self.context.objectForKeyedSubscript("Object")?
      .objectForKeyedSubscript("getOwnPropertyNames")
      .call(withArguments: [self])
    return names?.toArray().map { arr in arr.compactMap { $0 as? String } }
  }

  fileprivate var isFinite: Bool {
    guard let isFinite = self.context.objectForKeyedSubscript("isFinite") else {
      return true
    }
    return isFinite.call(withArguments: [self]).toBool()
  }
}

extension String {
  fileprivate var jsObjectKeyString: String {
    if let int = Int(self) {
      return "'\(int)'"
    }
    return self
  }
}

extension String {
  private static let formatRegex = try! NSRegularExpression(
    pattern: "(?<!%)%(s|i|d|f|c|o|O)"
  )

  private enum JSConsoleFormatter: String, CaseIterable {
    case string = "%s"
    case integerD = "%d"
    case integerI = "%i"
    case float = "%f"
    case domElement = "%o"
    case css = "%c"
    case object = "%O"

    func format(value: JSValue) -> String {
      switch self {
      case .integerD, .integerI:
        guard value.isNumber else { return "NaN" }
        return value.isFinite ? "\(value.toInt32())" : "Infinity"

      case .float:
        guard value.isNumber else { return "NaN" }
        return value.toString()

      case .string:
        return value.loggableString()

      case .domElement, .object:
        return value.loggableString(isNested: true)

      case .css:
        return ""
      }
    }
  }

  fileprivate init(jsFormat: String, args: [JSValue]) {
    var splits = jsFormat.splitKeepingMatches(with: Self.formatRegex)
    var argsIndex = 0
    for (index, split) in splits.enumerated() {
      guard argsIndex < args.count else { break }
      guard let formatter = JSConsoleFormatter(rawValue: split) else { continue }
      splits[index] = formatter.format(value: args[argsIndex])
      argsIndex += 1
    }
    let rest = argsIndex < args.count ? Array(args[argsIndex...]) : []
    let strings = [splits.joined()] + rest.map { $0.loggableString() }
    self = strings.joined(separator: " ")
  }
}

extension String {
  fileprivate func splitKeepingMatches(with regex: NSRegularExpression) -> [String] {
    let nsString = self as NSString
    let fullRange = NSRange(location: 0, length: nsString.length)
    let matches = regex.matches(in: self, range: fullRange)
    var results: [String] = []
    var previousEnd = 0
    for match in matches {
      let range = match.range
      if range.location > previousEnd {
        let substringRange = NSRange(location: previousEnd, length: range.location - previousEnd)
        let substring = nsString.substring(with: substringRange)
        results.append(substring)
      }
      let matchString = nsString.substring(with: range)
      results.append(matchString)
      previousEnd = range.location + range.length
    }
    if previousEnd < nsString.length {
      let substring = nsString.substring(from: previousEnd)
      results.append(substring)
    }
    return results
  }
}

extension DateFormatter {
  fileprivate static let jsString: DateFormatter = {
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
    formatter.timeZone = TimeZone(identifier: "GMT")
    return formatter
  }()
}
