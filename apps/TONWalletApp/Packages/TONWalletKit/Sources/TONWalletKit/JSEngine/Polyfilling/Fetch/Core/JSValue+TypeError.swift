import JavaScriptCore

extension JSValue {
  public static func typeError(message: String, in context: JSContext) -> JSValue {
    context.objectForKeyedSubscript("TypeError").construct(withArguments: [message])
  }

  public static func constructError(
    className: String,
    message: String,
    in context: JSContext
  ) -> JSValue {
    .typeError(message: "Failed to construct '\(className)': \(message)", in: context)
  }
}
