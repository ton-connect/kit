function DOMException(message, name) {
  Error.call(this, message);
  this[Symbol._jsCoreExtrasPrivate] = { message, name };
}

DOMException.prototype = Object.create(Error.prototype);
DOMException.prototype.constructor = DOMException;

Object.defineProperties(DOMException.prototype, {
  name: _jsCoreExtrasReadonlyProperty(function () {
    return this[Symbol._jsCoreExtrasPrivate].name;
  }),
  message: _jsCoreExtrasReadonlyProperty(function () {
    return this[Symbol._jsCoreExtrasPrivate].message;
  }),
});
