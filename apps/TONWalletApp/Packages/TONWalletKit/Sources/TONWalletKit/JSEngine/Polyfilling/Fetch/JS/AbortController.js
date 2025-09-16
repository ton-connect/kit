function AbortController() {
  this[Symbol._jsCoreExtrasPrivate] = new AbortSignal(
    Symbol._jsCoreExtrasPrivate,
  );
}

Object.defineProperties(AbortController.prototype, {
  signal: _jsCoreExtrasReadonlyProperty(function () {
    return this[Symbol._jsCoreExtrasPrivate];
  }),
  abort: _jsCoreExtrasFunctionProperty(function (reason) {
    this[Symbol._jsCoreExtrasPrivate]._jsCoreExtrasAbort(reason);
  }),
});

function AbortSignal(key) {
  _jsCoreExtrasInternalConstructorCheck(key);
  this[Symbol._jsCoreExtrasPrivate] = {
    subscribers: [],
    dependencies: [],
    aborted: false,
    reason: undefined,
    onabort: undefined,
  };
}

Object.defineProperties(AbortSignal.prototype, {
  aborted: _jsCoreExtrasReadonlyProperty(function () {
    return this[Symbol._jsCoreExtrasPrivate].aborted;
  }),
  reason: _jsCoreExtrasReadonlyProperty(function () {
    return this[Symbol._jsCoreExtrasPrivate].reason;
  }),
  onabort: {
    get: function () {
      return this[Symbol._jsCoreExtrasPrivate].onabort;
    },
    set: function (fn) {
      this[Symbol._jsCoreExtrasPrivate].onabort = fn;
    },
    enumerable: true,
    configurable: true,
  },
  throwIfAborted: _jsCoreExtrasFunctionProperty(function () {
    const state = this[Symbol._jsCoreExtrasPrivate];
    if (!state.aborted) return;
    if (state.reason) throw state.reason;
    throw new DOMException("signal is aborted without reason", "AbortError");
  }),
  // NB: It seems that JSCore doesn't provide EventTarget, so we'll have to implement event
  // listeners by hand.
  addEventListener: _jsCoreExtrasFunctionProperty(function (event, listener) {
    _jsCoreExtrasEnsureMinArgCount(
      "addEventListener",
      "AbortSignal",
      [event, listener],
      2,
    );
    if (typeof listener !== "object" && typeof listener !== "function") {
      throw _jsCoreExtrasFailedToExecute(
        "AbortSignal",
        "addEventListener",
        "parameter 2 is not of type 'Object'",
      );
    }
    if (event !== "abort") return;
    this[Symbol._jsCoreExtrasPrivate].subscribers.push(listener);
  }),
  removeEventListener: _jsCoreExtrasFunctionProperty(
    function (event, listener) {
      _jsCoreExtrasEnsureMinArgCount(
        "removeEventListener",
        "AbortSignal",
        [event, listener],
        2,
      );
      if (typeof listener !== "object" && typeof listener !== "function") {
        throw _jsCoreExtrasFailedToExecute(
          "AbortSignal",
          "removeEventListener",
          "parameter 2 is not of type 'Object'",
        );
      }
      const state = this[Symbol._jsCoreExtrasPrivate];
      if (event !== "abort") return;
      state.subscribers = state.subscribers.filter((s) => s !== listener);
    },
  ),
  _jsCoreExtrasAddDependency: _jsCoreExtrasFunctionProperty(function (other) {
    this[Symbol._jsCoreExtrasPrivate].dependencies.push(other);
  }),
  _jsCoreExtrasAbort: _jsCoreExtrasFunctionProperty(function (reason) {
    const state = this[Symbol._jsCoreExtrasPrivate];
    if (state.aborted) return;
    const event = { type: "abort", target: this };
    state.aborted = true;
    state.reason = reason;
    state.onabort?.(event);
    for (const subscriber of state.subscribers) {
      subscriber({ ...event });
    }
    for (dependentSignal of state.dependencies) {
      dependentSignal._jsCoreExtrasAbort(reason);
    }
  }),
});

AbortSignal.abort = function (reason) {
  const controller = new AbortController();
  controller.abort(reason);
  return controller.signal;
};

AbortSignal.timeout = function (millis) {
  _jsCoreExtrasEnsureMinArgCount("timeout", "AbortSignal", [millis], 1);
  if (typeof millis !== "number") {
    throw _jsCoreExtrasFailedToExecute(
      "AbortSignal",
      "timeout",
      "Value is not of type 'unsigned long long'.",
    );
  }
  const controller = new AbortController();
  _jsCoreExtrasAbortSignalTimeout(controller, millis / 1000);
  return controller.signal;
};

AbortSignal.any = function (signals) {
  _jsCoreExtrasEnsureMinArgCount("any", "AbortSignal", [signals], 1);
  if (!(Symbol.iterator in signals)) {
    throw _jsCoreExtrasFailedToExecute(
      "AbortSignal",
      "any",
      "The provided value cannot be converted to a sequence.",
    );
  }
  const controller = new AbortController();
  for (const s of signals) {
    if (!(s instanceof AbortSignal)) {
      throw _jsCoreExtrasFailedToExecute(
        "AbortSignal",
        "any",
        "Failed to convert value to 'AbortSignal'.",
      );
    }
    if (s.aborted) {
      controller.abort(s.reason);
      return controller.signal;
    }
  }
  for (const s of signals) {
    s._jsCoreExtrasAddDependency(controller.signal);
  }
  return controller.signal;
};
