// Monkey-patch the project's logger to emit structured markers when request/op ids are present
try {
  // Attempt to load via mapped name used in tests
  const modPaths = ['utils/logger', './utils/logger', '<rootDir>/utils/logger'];
  let loggerMod = null;
  for (const p of modPaths) {
    try {
      loggerMod = require(p);
      if (loggerMod) break;
    } catch (e) {
      // ignore
    }
  }
  if (!loggerMod) {
    // last resort: try relative path
    try {
      loggerMod = require('../utils/logger');
    } catch (e) {}
  }

  if (loggerMod) {
    const logger = loggerMod.logger || loggerMod.default || loggerMod;
    const exportedLog = loggerMod.log || {};

    function emitMarkerFromArgs(level, message, maybeContext) {
      try {
        const ctx = maybeContext || {};
        const opCandidates = [];
        if (ctx && typeof ctx === 'object') {
          if (ctx.requestId) opCandidates.push(ctx.requestId);
          if (ctx.request_id) opCandidates.push(ctx.request_id);
          if (ctx.opId) opCandidates.push(ctx.opId);
          if (ctx.op_id) opCandidates.push(ctx.op_id);
          if (ctx.reqId) opCandidates.push(ctx.reqId);
          if (ctx.req_id) opCandidates.push(ctx.req_id);
        }
        // also scan message for tokens
        if (typeof message === 'string') {
          const m = message.match(/request[_\- ]?id[:=]?\s*([A-Za-z0-9-_.]+)/i);
          if (m && m[1]) opCandidates.push(m[1]);
        }
        if (opCandidates.length) {
          const marker = JSON.stringify({ts: new Date().toISOString(), hr: process.hrtime.bigint ? process.hrtime.bigint().toString() : Date.now().toString(), level, opIds: Array.from(new Set(opCandidates)), message});
          process.stderr.write(`__OP_ID_MARKER__ ${marker}\n`);
        }
      } catch (e) {
        // ignore
      }
    }

    // Wrap instance methods if present
    ['debug', 'info', 'warn', 'error'].forEach((m) => {
      if (logger && typeof logger[m] === 'function') {
        const orig = logger[m].bind(logger);
        logger[m] = function (message, a, b) {
          try {
            // call original
            orig(message, a, b);
          } finally {
            emitMarkerFromArgs(m, message, a || b);
          }
        };
      }

      if (exportedLog && typeof exportedLog[m] === 'function') {
        const orig2 = exportedLog[m].bind(exportedLog);
        exportedLog[m] = function (message, a, b) {
          try {
            orig2(message, a, b);
          } finally {
            emitMarkerFromArgs(m, message, a || b);
          }
        };
      }
    });
  }
} catch (e) {
  // don't crash tests if instrumentation fails
   
  console.warn('logger-wrap: failed to instrument logger', e?.message || e);
}
