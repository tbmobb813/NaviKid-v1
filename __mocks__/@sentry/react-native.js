// Minimal manual mock for @sentry/react-native to avoid importing ESM distribution in Jest
// Exports the small surface the codebase uses in tests: logger and capture helpers.
const noop = () => {};

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
  captureException: noop,
  captureMessage: noop,
  addBreadcrumb: noop,
  setExtra: noop,
  setTag: noop,
  setUser: noop,
};
