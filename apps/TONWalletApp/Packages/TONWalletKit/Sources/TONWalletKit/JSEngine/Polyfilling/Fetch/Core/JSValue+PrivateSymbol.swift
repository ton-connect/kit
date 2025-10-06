import JavaScriptCore

extension JSValue {
  convenience init(privateSymbolIn context: JSContext) {
    self.init(newSymbolFromDescription: "_jsCoreExtrasPrivate", in: context)
  }
}
