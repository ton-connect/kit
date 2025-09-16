const _jsCoreExtrasBodyKind = { Request: "Request", Response: "Response" };

class _JSCoreExtrasHTTPBody {
  bodyKind = _jsCoreExtrasBodyKind.Request;

  get contentTypeHeader() {
    return null;
  }

  async bytes() {
    this.#subclassResponsibility();
  }

  async text() {
    this.#subclassResponsibility();
  }

  async blob() {
    this.#subclassResponsibility();
  }

  async formData() {
    throw _jsCoreExtrasFailedToExecute(
      this.bodyKind,
      "formData",
      "Failed to fetch",
    );
  }

  async arrayBuffer() {
    return await this.bytes().then((b) => b.buffer);
  }

  async json() {
    return await this.text().then(JSON.parse);
  }

  #subclassResponsibility() {
    throw new Error("Subclass Responsibility");
  }
}

class _JSCoreExtrasNullishBody extends _JSCoreExtrasHTTPBody {
  static Request = _JSCoreExtrasNullishBody.ofKind(
    _jsCoreExtrasBodyKind.Request,
  );
  static Response = _JSCoreExtrasNullishBody.ofKind(
    _jsCoreExtrasBodyKind.Response,
  );

  static ofKind(bodyKind) {
    const body = new _JSCoreExtrasNullishBody();
    body.bodyKind = bodyKind;
    return body;
  }

  async text() {
    return "";
  }

  async blob() {
    return new Blob([""]);
  }

  async bytes() {
    return new Uint8Array([]);
  }
}

class _JSCoreExtrasToStringableBody extends _JSCoreExtrasHTTPBody {
  #value;

  get contentTypeHeader() {
    return "text/plain; charset=UTF-8";
  }

  constructor(value) {
    super();
    this.#value = value;
  }

  async text() {
    return this.#value.toString();
  }

  async bytes() {
    return _jsCoreExtrasStringToUint8Array(this.#value.toString());
  }

  async blob() {
    return new Blob([this.#value.toString()]);
  }
}

class _JSCoreExtrasBlobBody extends _JSCoreExtrasHTTPBody {
  #blob;

  get contentTypeHeader() {
    return this.#blob.type;
  }

  constructor(blob) {
    super();
    this.#blob = blob;
  }

  async text() {
    return await this.#blob.text();
  }

  async bytes() {
    return await this.#blob.bytes();
  }

  async blob() {
    return this.#blob;
  }
}

class _JSCoreExtrasArrayBufferBody extends _JSCoreExtrasHTTPBody {
  #buffer;

  get #text() {
    return _jsCoreExtrasUint8ArrayToString(new Uint8Array(this.#buffer));
  }

  constructor(buffer) {
    super();
    this.#buffer = buffer.transfer();
  }

  async text() {
    return this.#text;
  }

  async bytes() {
    return new Uint8Array(this.#buffer);
  }

  async blob() {
    return new Blob([this.#text]);
  }
}

class _JSCoreExtrasFormDataBody extends _JSCoreExtrasHTTPBody {
  #formData;
  #boundary;

  get contentTypeHeader() {
    return `multipart/form-data; boundary=${this.#boundary}`;
  }

  constructor(formData) {
    super();
    this.#formData = formData._jsCoreExtrasCopy();
    this.#boundary = _jsCoreExtrasFormDataBoundary();
  }

  async text() {
    return await this.#formData._jsCoreExtrasEncoded(this.#boundary);
  }

  async bytes() {
    return _jsCoreExtrasStringToUint8Array(await this.text());
  }

  async blob() {
    return new Blob([await this.text()]);
  }

  async formData() {
    return this.#formData;
  }
}

function _jsCoreExtrasHTTPBodyConsumerProperty(methodName, bodyKind) {
  return _jsCoreExtrasFunctionProperty(function () {
    if (this[Symbol._jsCoreExtrasPrivate].bodyUsed) {
      throw _jsCoreExtrasFailedToExecute(
        bodyKind,
        methodName,
        "body stream already read",
      );
    }
    this[Symbol._jsCoreExtrasPrivate].bodyUsed = true;
    return this[Symbol._jsCoreExtrasPrivate].body[methodName]();
  });
}

function _jsCoreExtrasHTTPHeaders(headers, body) {
  try {
    const newHeaders = new Headers(headers);
    if (newHeaders.has("Content-Type") || !body.contentTypeHeader) {
      return newHeaders;
    }
    newHeaders.set("Content-Type", body.contentTypeHeader);
    return newHeaders;
  } catch (e) {
    throw new TypeError(
      e.message.replace(
        "Failed to construct 'Headers':",
        `Failed to construct '${body.bodyKind}': Failed to read the 'headers' property from '${body.bodyKind}Init':`,
      ),
    );
  }
}

function _jsCoreExtrasHTTPBody(rawBody, bodyKind) {
  let body;
  if (rawBody instanceof Blob) {
    body = new _JSCoreExtrasBlobBody(rawBody);
  } else if (rawBody === undefined || rawBody === null) {
    body = _JSCoreExtrasNullishBody[bodyKind];
  } else if (ArrayBuffer.isView(rawBody)) {
    body = new _JSCoreExtrasArrayBufferBody(rawBody.buffer);
  } else if (rawBody instanceof ArrayBuffer) {
    body = new _JSCoreExtrasArrayBufferBody(rawBody);
  } else if (rawBody instanceof FormData) {
    body = new _JSCoreExtrasFormDataBody(rawBody);
  } else {
    body = new _JSCoreExtrasToStringableBody(rawBody);
  }
  body.bodyKind = bodyKind;
  return body;
}
