function Crypto(key) {
  _jsCoreExtrasInternalConstructorCheck(key);
}

Object.defineProperties(Crypto.prototype, {
  randomUUID: _jsCoreExtrasFunctionProperty(_jsCoreExtrasRandomUUID),
  getRandomValues: _jsCoreExtrasFunctionProperty(function (view) {
    _jsCoreExtrasEnsureMinArgCount("getRandomValues", "Crypto", [view], 1);
    if (!ArrayBuffer.isView(view)) {
      throw _jsCoreExtrasFailedToExecute(
        "Crypto",
        "getRandomValues",
        "parameter 1 is not of type 'ArrayBufferView'.",
      );
    }
    const dataView = new DataView(view.buffer);
    const bytes = _jsCoreExtrasRandomBytes(view.byteLength);
    for (let i = 0; i < view.byteLength; i++) {
      dataView.setUint8(i, bytes[i]);
    }
    return view;
  }),
});

const crypto = new Crypto(Symbol._jsCoreExtrasPrivate);
