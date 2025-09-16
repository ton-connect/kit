import JavaScriptCore

extension JSContext {
  /// Sets an object in this context using a nestable path.
  ///
  /// ```swift
  /// let context = JSContext()!
  ///
  /// // Use "." to set nested properties as you would in Javascript.
  /// context.setObject("hello", forPath: "foo.bar.baz")
  /// let value = context.evaluateScript("foo.bar.baz")
  /// #expect(value?.toString() == "hello")
  /// ```
  ///
  /// - Parameters:
  ///   - object: The object value to set the property at the path to.
  ///   - path: The path to the object property.
  public func setObject(_ object: Any?, forPath path: String) {
    self.globalObject.setValue(object, forPath: path)
  }
}

extension JSValue {
  /// Sets an object in this value using a nestable path.
  ///
  /// ```swift
  /// let value = JSValue(newObjectIn: .current())!
  ///
  /// // Use "." to set nested properties as you would in Javascript.
  /// value.setValue("hello", forPath: "foo.bar.baz")
  /// let value = value.context.evaluateScript("foo.bar.baz")
  /// #expect(value?.toString() == "hello")
  /// ```
  ///
  /// - Parameters:
  ///   - object: The object value to set the property at the path to.
  ///   - path: The path to the object property.
  public func setValue(_ object: Any?, forPath path: String) {
    let subpaths = path.split(separator: ".")
    guard let firstPath = subpaths.first, let lastPath = subpaths.last else { return }
    if subpaths.count == 1 {
      self.setObject(object, forKeyedSubscript: firstPath as NSString)
    } else {
      var currentValue = self.objectForKeyedSubscript(firstPath as NSString)
      for subpath in subpaths.dropLast() {
        if let object = self.objectForKeyedSubscript(subpath as NSString), !object.isUndefined {
          currentValue = object
          continue
        }
        let object = JSValue(newObjectIn: self.context)
        if let currentValue, currentValue.isUndefined {
          self.setObject(object, forKeyedSubscript: subpath as NSString)
        } else {
          currentValue?.setObject(object, forKeyedSubscript: subpath as NSString)
        }
        currentValue = object
      }
      currentValue?.setObject(object, forKeyedSubscript: lastPath as NSString)
    }
  }
}
