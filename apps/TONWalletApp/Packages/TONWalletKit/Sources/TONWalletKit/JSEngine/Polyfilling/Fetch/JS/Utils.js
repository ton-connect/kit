function _jsCoreExtrasFailedToExecute(name, method, message) {
  return new TypeError(
    `Failed to execute '${method}' on '${name}': ${message}`,
  );
}

function _jsCoreExtrasFailedToConstruct(name, message) {
  return new TypeError(`Failed to construct '${name}': ${message}`);
}

function _jsCoreExtrasInternalConstructorCheck(key) {
  if (key !== Symbol._jsCoreExtrasPrivate) {
    throw new TypeError("Illegal constructor");
  }
}

function _jsCoreExtrasEnsureMinArgCount(name, clazz, args, expected) {
  if (args.length < expected) {
    const argName = expected === 2 ? "arguments" : "argument";
    throw new TypeError(
      `Failed to execute '${name}' on '${clazz}': ${expected} ${argName} required, but only ${args.length} present.`,
    );
  }
}

function _jsCoreExtrasEnsureMinArgConstructor(clazz, args, expected) {
  if (args.length < expected) {
    const argName = expected === 2 ? "arguments" : "argument";
    throw new TypeError(
      `Failed to construct '${clazz}': ${expected} ${argName} required, but only ${args.length} present.`,
    );
  }
}

function _jsCoreExtrasUint8ArrayToString(array) {
  return Array.prototype.map
    .call(array, (c) => String.fromCharCode(c))
    .join("");
}

function _jsCoreExtrasStringToUint8Array(str) {
  const uint8Array = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    uint8Array[i] = str.charCodeAt(i);
  }
  return uint8Array;
}

function _jsCoreExtrasFunctionProperty(fn) {
  return {
    value: fn,
    enumerable: false,
    configurable: false,
  };
}

function _jsCoreExtrasReadonlyProperty(fn) {
  return {
    get: fn,
    enumerable: true,
    configurable: true,
  };
}
