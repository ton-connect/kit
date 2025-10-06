function Response(responseBody, options) {
  if (options !== undefined && typeof options !== "object") {
    throw _jsCoreExtrasFailedToConstruct(
      "Response",
      "The provided value is not of type 'ResponseInit'.",
    );
  }
  const body = _jsCoreExtrasHTTPBody(
    responseBody,
    _jsCoreExtrasBodyKind.Response,
  );
  this[Symbol._jsCoreExtrasPrivate] = {
    body,
    rawBody: responseBody,
    bodyUsed: false,
    options: {
      ...options,
      headers: _jsCoreExtrasHTTPHeaders(options?.headers, body),
    },
  };
}

Response.error = function () {
  const resp = new Response();
  const state = resp[Symbol._jsCoreExtrasPrivate];
  resp[Symbol._jsCoreExtrasPrivate] = {
    ...state,
    options: { ...state.options, status: 0, type: "error" },
  };
  return resp;
};

const _jsCoreExtras_REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);

Response.redirect = function (url, status) {
  _jsCoreExtrasEnsureMinArgCount("redirect", "Response", [url, status], 1);
  const statusCode = status ?? 302;
  if (!_jsCoreExtras_REDIRECT_STATUS_CODES.has(statusCode)) {
    throw _jsCoreExtrasFailedToExecute(
      "Response",
      "redirect",
      "Invalid status code",
    );
  }
  const resp = new Response();
  const state = resp[Symbol._jsCoreExtrasPrivate];
  resp[Symbol._jsCoreExtrasPrivate] = {
    ...state,
    options: { ...state.options, url, status: statusCode, redirected: true },
  };
  return resp;
};

Response.json = function (jsonSerializeable, options) {
  _jsCoreExtrasEnsureMinArgCount(
    "json",
    "Response",
    [jsonSerializeable, options],
    1,
  );
  if (jsonSerializeable === undefined) {
    throw _jsCoreExtrasFailedToExecute(
      "Response",
      "json",
      "The data is not JSON serializable",
    );
  }
  const rawBody = JSON.stringify(jsonSerializeable);
  const headers = _jsCoreExtrasHTTPHeaders(
    options?.headers,
    _JSCoreExtrasNullishBody.Response,
  );
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return new Response(rawBody, { ...options, headers });
};

Object.defineProperties(Response.prototype, {
  bodyUsed: _jsCoreExtrasReadonlyProperty(function () {
    return this[Symbol._jsCoreExtrasPrivate].bodyUsed;
  }),
  clone: _jsCoreExtrasFunctionProperty(function () {
    const response = new Response();
    const state = this[Symbol._jsCoreExtrasPrivate];
    response[Symbol._jsCoreExtrasPrivate] = {
      ...state,
      body: _jsCoreExtrasHTTPBody(
        state.rawBody,
        _jsCoreExtrasBodyKind.Response,
      ),
    };
    return response;
  }),
  ok: _jsCoreExtrasReadonlyProperty(function () {
    return this.status >= 200 && this.status < 300;
  }),
  status: _jsCoreExtrasHTTPOptionsProperty("status", 200),
  headers: _jsCoreExtrasHTTPOptionsProperty("headers", new Headers()),
  statusText: _jsCoreExtrasHTTPOptionsProperty("statusText", ""),
  type: _jsCoreExtrasHTTPOptionsProperty("type", "defaut"),
  redirected: _jsCoreExtrasHTTPOptionsProperty("redirected", false),
  url: _jsCoreExtrasHTTPOptionsProperty("url", ""),
  blob: _jsCoreExtrasHTTPBodyConsumerProperty(
    "blob",
    _jsCoreExtrasBodyKind.Response,
  ),
  arrayBuffer: _jsCoreExtrasHTTPBodyConsumerProperty(
    "arrayBuffer",
    _jsCoreExtrasBodyKind.Response,
  ),
  bytes: _jsCoreExtrasHTTPBodyConsumerProperty(
    "bytes",
    _jsCoreExtrasBodyKind.Response,
  ),
  text: _jsCoreExtrasHTTPBodyConsumerProperty(
    "text",
    _jsCoreExtrasBodyKind.Response,
  ),
  json: _jsCoreExtrasHTTPBodyConsumerProperty(
    "json",
    _jsCoreExtrasBodyKind.Response,
  ),
  formData: _jsCoreExtrasHTTPBodyConsumerProperty(
    "formData",
    _jsCoreExtrasBodyKind.Response,
  ),
});
