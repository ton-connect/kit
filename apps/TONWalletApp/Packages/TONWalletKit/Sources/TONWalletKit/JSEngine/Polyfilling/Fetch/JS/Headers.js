function Headers(headers) {
  const convert = (value, delmimeter = ",") => {
    return Array.isArray(value) ? value.join(delmimeter) : value.toString();
  };

  if (typeof headers === "object" && Symbol.iterator in headers) {
    const array = Array.isArray(headers) ? headers : Array.from(headers);
    const stringified = array.map((h) => {
      if (!Array.isArray(h)) {
        throw _jsCoreExtrasFailedToConstruct(
          "Headers",
          "The provided value cannot be converted to a sequence.",
        );
      }
      if (h.length !== 2) {
        throw _jsCoreExtrasFailedToConstruct("Headers", "Invalid value.");
      }
      const [key, value] = h;
      return [key.toString().toLowerCase(), convert(value)];
    });
    this[Symbol._jsCoreExtrasPrivate] = { map: new Map(stringified) };
  } else if (headers === undefined) {
    this[Symbol._jsCoreExtrasPrivate] = { map: new Map() };
  } else if (typeof headers === "object") {
    const stringified = Object.entries(headers).map(([key, value]) => {
      return [key.toString().toLowerCase(), convert(value)];
    });
    this[Symbol._jsCoreExtrasPrivate] = { map: new Map(stringified) };
  } else {
    throw _jsCoreExtrasFailedToConstruct(
      "Headers",
      "The provided value is not of type '(record<ByteString, ByteString> or sequence<sequence<ByteString>>)'.",
    );
  }
  this[Symbol._jsCoreExtrasPrivate].convert = convert;
  this[Symbol.iterator] = this.entries;
}

Object.defineProperties(Headers.prototype, {
  entries: _jsCoreExtrasFunctionProperty(function* () {
    for (const [key, value] of this[
      Symbol._jsCoreExtrasPrivate
    ].map.entries()) {
      yield [
        key.toString(),
        this[Symbol._jsCoreExtrasPrivate].convert(value, ", "),
      ];
    }
  }),
  values: _jsCoreExtrasFunctionProperty(function* () {
    for (const [_, value] of this.entries()) {
      yield value;
    }
  }),
  keys: _jsCoreExtrasFunctionProperty(function* () {
    for (const [key, _] of this.entries()) {
      yield key;
    }
  }),
  forEach: _jsCoreExtrasFunctionProperty(function (fn) {
    _jsCoreExtrasEnsureMinArgCount("forEach", "Headers", [fn], 1);
    if (typeof fn !== "function") {
      throw _jsCoreExtrasFailedToExecute(
        "Headers",
        "forEach",
        "parameter 1 is not of type 'Function'.",
      );
    }
    for (const [_, value] of this.entries()) {
      fn(value);
    }
  }),
  has: _jsCoreExtrasFunctionProperty(function (key) {
    _jsCoreExtrasEnsureMinArgCount("has", "Headers", [key], 1);
    return this.get(key) !== null;
  }),
  get: _jsCoreExtrasFunctionProperty(function (key) {
    _jsCoreExtrasEnsureMinArgCount("get", "Headers", [key], 1);
    const value = this[Symbol._jsCoreExtrasPrivate].map.get(
      key.toString().toLowerCase(),
    );
    return value
      ? this[Symbol._jsCoreExtrasPrivate].convert(value, ", ")
      : null;
  }),
  getSetCookie: _jsCoreExtrasFunctionProperty(function () {
    const cookie = this[Symbol._jsCoreExtrasPrivate].map.get("set-cookie");
    if (Array.isArray(cookie)) {
      return cookie;
    } else if (typeof cookie === "string") {
      return [cookie];
    } else {
      return [];
    }
  }),
  set: _jsCoreExtrasFunctionProperty(function (key, value) {
    _jsCoreExtrasEnsureMinArgCount("set", "Headers", [key, value], 2);
    this[Symbol._jsCoreExtrasPrivate].map.set(
      key.toString().toLowerCase(),
      this[Symbol._jsCoreExtrasPrivate].convert(value),
    );
  }),
  append: _jsCoreExtrasFunctionProperty(function (key, value) {
    _jsCoreExtrasEnsureMinArgCount("append", "Headers", [key, value], 2);
    const currentValue = this[Symbol._jsCoreExtrasPrivate].map.get(
      key.toString().toLowerCase(),
    );
    if (currentValue === undefined) {
      this[Symbol._jsCoreExtrasPrivate].map.set(key.toString().toLowerCase(), [
        this[Symbol._jsCoreExtrasPrivate].convert(value),
      ]);
    } else if (Array.isArray(currentValue)) {
      currentValue.push(this[Symbol._jsCoreExtrasPrivate].convert(value));
    } else {
      this[Symbol._jsCoreExtrasPrivate].map.set(key.toString().toLowerCase(), [
        currentValue,
        this[Symbol._jsCoreExtrasPrivate].convert(value),
      ]);
    }
  }),
  delete: _jsCoreExtrasFunctionProperty(function (key) {
    _jsCoreExtrasEnsureMinArgCount("delete", "Headers", [key], 1);
    this[Symbol._jsCoreExtrasPrivate].map.delete(key.toString().toLowerCase());
  }),
});
