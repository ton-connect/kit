const _jsCoreExtras_OPTIONS_PROPERTY_MAPPINGS = {
  keepalive: (value) => !!value,
  redirected: (value) => !!value,
  headers: (value) => value,
  status: (value) => value,
  signal: (value) => value,
};

function _jsCoreExtrasHTTPOptionsProperty(path, defaultValue) {
  const mapping = _jsCoreExtras_OPTIONS_PROPERTY_MAPPINGS[path];
  return _jsCoreExtrasReadonlyProperty(function () {
    const value = this[Symbol._jsCoreExtrasPrivate].options[path];
    return value === undefined
      ? defaultValue
      : (mapping?.(value) ?? value.toString());
  });
}
