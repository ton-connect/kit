function Request(urlOrRequest, options) {
  _jsCoreExtrasEnsureMinArgConstructor("Request", [urlOrRequest, options], 1);
  if (options !== undefined && typeof options !== "object") {
    throw _jsCoreExtrasFailedToConstruct(
      "Request",
      "The provided value is not of type 'RequestInit'.",
    );
  }
  const { requestOptions, ...rest } =
    urlOrRequest instanceof Request
      ? {
          url: urlOrRequest[Symbol._jsCoreExtrasPrivate].url,
          bodyUsed: urlOrRequest[Symbol._jsCoreExtrasPrivate].bodyUsed,
          requestOptions: {
            ...urlOrRequest[Symbol._jsCoreExtrasPrivate].options,
            ...options,
          },
        }
      : {
          url: urlOrRequest.toString(),
          bodyUsed: false,
          requestOptions: options,
        };
  const method = requestOptions?.method ?? "GET";
  const canHaveBody = method !== "GET" && method !== "HEAD";
  if (requestOptions?.body !== undefined && !canHaveBody) {
    throw _jsCoreExtrasFailedToConstruct(
      "Request",
      "Request with GET/HEAD method cannot have body.",
    );
  }
  const body = _jsCoreExtrasHTTPBody(
    requestOptions?.body,
    _jsCoreExtrasBodyKind.Request,
  );
  this[Symbol._jsCoreExtrasPrivate] = {
    ...rest,
    body,
    options: {
      ...requestOptions,
      headers: _jsCoreExtrasHTTPHeaders(requestOptions?.headers, body),
    },
  };
}

Object.defineProperties(Request.prototype, {
  url: _jsCoreExtrasReadonlyProperty(function () {
    return this[Symbol._jsCoreExtrasPrivate].url;
  }),
  bodyUsed: _jsCoreExtrasReadonlyProperty(function () {
    return this[Symbol._jsCoreExtrasPrivate].bodyUsed;
  }),
  method: _jsCoreExtrasHTTPOptionsProperty("method", "GET"),
  headers: _jsCoreExtrasHTTPOptionsProperty("headers", new Headers()),
  signal: _jsCoreExtrasHTTPOptionsProperty("signal"),
  credentials: _jsCoreExtrasHTTPOptionsProperty("credentials", "include"),
  cache: _jsCoreExtrasHTTPOptionsProperty("cache", "default"),
  integrity: _jsCoreExtrasHTTPOptionsProperty("integrity", ""),
  keepalive: _jsCoreExtrasHTTPOptionsProperty("keepalive", false),
  mode: _jsCoreExtrasHTTPOptionsProperty("mode", "cors"),
  redirect: _jsCoreExtrasHTTPOptionsProperty("redirect", "follow"),
  referrer: _jsCoreExtrasHTTPOptionsProperty("referrer", "about:client"),
  referrerPolicy: _jsCoreExtrasHTTPOptionsProperty("referrerPolicy"),
  clone: _jsCoreExtrasFunctionProperty(function () {
    return new Request(this);
  }),
  blob: _jsCoreExtrasHTTPBodyConsumerProperty(
    "blob",
    _jsCoreExtrasBodyKind.Request,
  ),
  arrayBuffer: _jsCoreExtrasHTTPBodyConsumerProperty(
    "arrayBuffer",
    _jsCoreExtrasBodyKind.Request,
  ),
  bytes: _jsCoreExtrasHTTPBodyConsumerProperty(
    "bytes",
    _jsCoreExtrasBodyKind.Request,
  ),
  text: _jsCoreExtrasHTTPBodyConsumerProperty(
    "text",
    _jsCoreExtrasBodyKind.Request,
  ),
  json: _jsCoreExtrasHTTPBodyConsumerProperty(
    "json",
    _jsCoreExtrasBodyKind.Request,
  ),
  formData: _jsCoreExtrasHTTPBodyConsumerProperty(
    "formData",
    _jsCoreExtrasBodyKind.Request,
  ),
});
