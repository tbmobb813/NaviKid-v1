// Lightweight helper to wrap testing-library's act with structured start/end markers
// Used only in temporary test debugging runs to produce ACT-START/ACT-END markers
const { act } = require('@testing-library/react-native');

module.exports = async function loggedAct(cb) {
  const startHr = process.hrtime.bigint();
  const startIso = new Date().toISOString();
  // capture a short stack snippet to help find the caller site
  const stack = (new Error().stack || '').split('\n').slice(2, 6).map(s => s.trim()).join(' | ');
  try {
    console.log(`[TestDebug][ACT-START] ${startIso} hr=${startHr} stack=${stack}`);
    // Ensure we always call act in the same way tests do. If cb is sync or async,
    // calling act(async () => cb()) lets act handle sync updates; await for async.
    // Additionally, flush Jest timers and microtasks inside the same act so
    // timer callbacks can't fire after the component unmounts when tests use
    // helpers that advance timers without also flushing pending timers.
    const result = await act(async () => {
      const maybe = cb();
      // If Jest timer helpers are available, flush timers so callbacks run
      // inside the same act. Prefer runAllTimers when available to ensure
      // nested timers and chained callbacks are executed; fall back to
      // runOnlyPendingTimers where runAllTimers isn't present.
      try {
        if (typeof jest !== 'undefined') {
          if (typeof jest.runAllTimers === 'function') {
            jest.runAllTimers();
          } else if (typeof jest.runOnlyPendingTimers === 'function') {
            jest.runOnlyPendingTimers();
          }
        }
      } catch (e) {
        // ignore if jest globals aren't reachable
      }
      // Allow any microtask promises to settle before finishing the act.
      await Promise.resolve();
      return maybe;
    });
    const endHr = process.hrtime.bigint();
    const endIso = new Date().toISOString();
    const durMs = Number(endHr - startHr) / 1e6;
    console.log(`[TestDebug][ACT-END] ${endIso} hr=${endHr} duration_ms=${durMs.toFixed(3)} stack=${stack}`);
    return result;
  } catch (err) {
    const endHr = process.hrtime.bigint();
    const endIso = new Date().toISOString();
    const durMs = Number(endHr - startHr) / 1e6;
    console.log(`[TestDebug][ACT-END-ERR] ${endIso} hr=${endHr} duration_ms=${durMs.toFixed(3)} err=${err?.message} stack=${stack}`);
    throw err;
  }
};
