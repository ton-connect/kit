import JavaScriptCore

extension JSValue {
  public var isIterable: Bool {
    self.hasProperty(self.context.evaluateScript("Symbol.iterator"))
  }
}
