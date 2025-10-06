function FormData() {
  this[Symbol._jsCoreExtrasPrivate] = {
    map: new Map(),
  };
  this[Symbol.iterator] = this.entries;
}

function _jsCoreExtrasFormDataBoundary() {
  return `-----JavaScriptCoreExtrasBoundary${Math.random().toString(36).substring(2)}`;
}

Object.defineProperties(FormData.prototype, {
  entries: _jsCoreExtrasFunctionProperty(function* () {
    for (const [key, values] of this[
      Symbol._jsCoreExtrasPrivate
    ].map.entries()) {
      for (const value of values) {
        yield [key, value];
      }
    }
  }),
  values: _jsCoreExtrasFunctionProperty(function* () {
    for (const [_, value] of this.entries()) {
      yield value;
    }
  }),
  forEach: _jsCoreExtrasFunctionProperty(function (fn) {
    _jsCoreExtrasEnsureMinArgCount("forEach", "FormData", [fn], 1);
    if (typeof fn !== "function") {
      throw _jsCoreExtrasFailedToExecute(
        "FormData",
        "forEach",
        "parameter 1 is not of type 'Function'.",
      );
    }
    for (const [_, value] of this.entries()) {
      fn(value);
    }
  }),
  keys: _jsCoreExtrasFunctionProperty(function* () {
    for (const [key, _] of this.entries()) {
      yield key;
    }
  }),
  append: _jsCoreExtrasFunctionProperty(function (key, value, filename) {
    _jsCoreExtrasEnsureMinArgCount(
      "append",
      "FormData",
      [key, value, filename],
      3,
    );
    const values =
      this[Symbol._jsCoreExtrasPrivate].map.get(key.toString()) ?? [];
    values.push(this._jsCoreExtrasConvertValue(value, filename, "append"));
    this[Symbol._jsCoreExtrasPrivate].map.set(key.toString(), values);
  }),
  set: _jsCoreExtrasFunctionProperty(function (key, value, filename) {
    _jsCoreExtrasEnsureMinArgCount(
      "set",
      "FormData",
      [key, value, filename],
      3,
    );
    this[Symbol._jsCoreExtrasPrivate].map.set(key.toString(), [
      this._jsCoreExtrasConvertValue(value, filename, "set"),
    ]);
  }),
  delete: _jsCoreExtrasFunctionProperty(function (key) {
    _jsCoreExtrasEnsureMinArgCount("delete", "FormData", [key], 1);
    this[Symbol._jsCoreExtrasPrivate].map.delete(key.toString());
  }),
  has: _jsCoreExtrasFunctionProperty(function (key) {
    _jsCoreExtrasEnsureMinArgCount("has", "FormData", [key], 1);
    return this[Symbol._jsCoreExtrasPrivate].map.has(key.toString());
  }),
  get: _jsCoreExtrasFunctionProperty(function (key) {
    _jsCoreExtrasEnsureMinArgCount("get", "FormData", [key], 1);
    const values = this[Symbol._jsCoreExtrasPrivate].map.get(key.toString());
    return values !== undefined ? values[0] : null;
  }),
  getAll: _jsCoreExtrasFunctionProperty(function (key) {
    _jsCoreExtrasEnsureMinArgCount("getAll", "FormData", [key], 1);
    return this[Symbol._jsCoreExtrasPrivate].map.get(key.toString()) ?? [];
  }),
  _jsCoreExtrasConvertValue: _jsCoreExtrasFunctionProperty(
    function (value, filename, kind) {
      if (value instanceof File) {
        return new File(value, filename ?? value.name, {
          lastModified: value.lastModified,
          type: value.type,
        });
      } else if (value instanceof Blob) {
        return new File(value, filename ?? "blob");
      }
      if (filename !== undefined) {
        throw _jsCoreExtrasFailedToExecute(
          "FormData",
          kind,
          "parameter 2 is not of type 'Blob'.",
        );
      }
      return value.toString();
    },
  ),
  _jsCoreExtrasCopy: _jsCoreExtrasFunctionProperty(function () {
    const data = new FormData();
    data[Symbol._jsCoreExtrasPrivate].map = new Map(
      this[Symbol._jsCoreExtrasPrivate].map,
    );
    return data;
  }),
  _jsCoreExtrasEncoded: _jsCoreExtrasFunctionProperty(
    async function (boundary) {
      const entries = Array.from(this);
      const texts = entries.map(([_, value]) => {
        if (value instanceof File) return value.text();
        return value;
      });
      const parts = [];
      for (let i = 0; i < entries.length; i++) {
        parts.push(`${boundary}\r\n`);
        const [key, file] = entries[i];
        const text = texts[i];
        if (!(text instanceof Promise)) {
          parts.push(
            `Content-Disposition: form-data; name="${key}"\r\n\r\n${text}\r\n`,
          );
          continue;
        }
        parts.push(
          `Content-Disposition: form-data; name="${key}"; filename="${file.name}"\r\nContent-Type: ${file.type}\r\n\r\n${await text}\r\n`,
        );
      }
      parts.push(`${boundary}--\r\n`);
      return parts.join("");
    },
  ),
});
