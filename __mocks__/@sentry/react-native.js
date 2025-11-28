// Minimal Jest manual mock for @sentry/react-native
// Provides a CommonJS-compatible surface so Jest doesn't try to parse the ESM bundle.

const noop = () => {};

class DummyTracing {
  constructor() {}
}

class DummyInstrumentation {
  constructor() {}
}

function withScope(cb) {
  try {
    const scope = {
      setLevel: noop,
      setContext: noop,
      setUser: noop,
      addBreadcrumb: noop,
      setExtras: noop,
    };
    return cb(scope);
  } catch (e) {
    // swallow in mock
  }
}

const logger = {
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
  log: noop,
};

module.exports = {
  logger,
  init: noop,
  withScope,
  captureException: noop,
  captureMessage: noop,
  addBreadcrumb: noop,
  setExtra: noop,
  setTag: noop,
  setUser: noop,
  flush: async () => Promise.resolve(),
  ReactNativeTracing: DummyTracing,
  ReactNavigationInstrumentation: DummyInstrumentation,
};
