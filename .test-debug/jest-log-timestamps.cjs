// Temporary test instrumentation for debugging timing/op-id issues
// - Prefixes console messages with ISO timestamps + high-resolution nanoseconds
// - Scans logged arguments for common op id patterns (opId, op_id, op-id) and prints a structured marker

const origLog = console.log.bind(console);
const origError = console.error.bind(console);
const origWarn = console.warn.bind(console);

function now() {
  // Use Date for human-readable and hrtime for finer ordering
  const iso = new Date().toISOString();
  let hr = 'hr?';
  try {
    // bigInt is supported in Node 12+
    hr = process.hrtime.bigint().toString();
  } catch (e) {
    hr = String(Date.now());
  }
  return `${iso} | ${hr}`;
}

function findOpIdsFromArgs(args) {
  const opIds = [];
  // match opId-like or requestId-like tokens in plain strings
  const regexes = [
    /op[_\- ]?id[:=]?\s*([A-Za-z0-9-_.]+)/i,
    /request[_\- ]?id[:=]?\s*([A-Za-z0-9-_.]+)/i,
    /req[_\- ]?id[:=]?\s*([A-Za-z0-9-_.]+)/i,
  ];

  for (const a of args) {
    if (!a) continue;
    if (typeof a === 'string') {
      for (const r of regexes) {
        const m = a.match(r);
        if (m && m[1]) opIds.push(m[1]);
      }
      continue;
    }
    if (typeof a === 'object') {
      try {
        // common keys
        if ('opId' in a && a.opId) opIds.push(a.opId);
        if ('op_id' in a && a.op_id) opIds.push(a.op_id);
        if ('requestId' in a && a.requestId) opIds.push(a.requestId);
        if ('request_id' in a && a.request_id) opIds.push(a.request_id);
        if ('reqId' in a && a.reqId) opIds.push(a.reqId);
        if ('req_id' in a && a.req_id) opIds.push(a.req_id);
        if ('op' in a && typeof a.op === 'object' && a.op.id) opIds.push(a.op.id);
        // try JSON stringify and regex fallback
        const s = JSON.stringify(a);
        for (const r of regexes) {
          const m = s.match(r);
          if (m && m[1]) opIds.push(m[1]);
        }
      } catch (e) {
        // ignore stringify errors
      }
    }
  }
  return Array.from(new Set(opIds));
}

function makeWrapper(orig, level) {
  return function (...args) {
    const t = now();
    try {
      orig(`${t} [${level}]`, ...args);
    } catch (e) {
      // if original logger throws for some reason, fallback
      process.stdout.write(`${t} [${level}] ` + args.map(String).join(' ') + '\n');
    }

    try {
      const opIds = findOpIdsFromArgs(args);
      if (opIds.length) {
        // write a compact structured marker (easy to grep)
        const marker = JSON.stringify({ts: new Date().toISOString(), hr: process.hrtime.bigint ? process.hrtime.bigint().toString() : Date.now().toString(), level, opIds});
        // write to stderr so it appears near errors and is easy to find
        process.stderr.write(`__OP_ID_MARKER__ ${marker}\n`);
      }
    } catch (e) {
      // ignore
    }
  };
}

console.log = makeWrapper(origLog, 'LOG');
console.error = makeWrapper(origError, 'ERR');
console.warn = makeWrapper(origWarn, 'WARN');

// Also instrument process.on('exit') to print final marker
process.on('exit', (code) => {
  try {
    const t = now();
    process.stderr.write(`__JEST_EXIT__ ${t} code=${code}\n`);
  } catch (e) {}
});

// Expose a small helper to tests if they want to dump a marker manually
exports.__testDebugDump = function (obj) {
  try {
    const marker = JSON.stringify({ts: new Date().toISOString(), hr: process.hrtime.bigint ? process.hrtime.bigint().toString() : Date.now().toString(), meta: obj});
    process.stderr.write(`__MANUAL_MARKER__ ${marker}\n`);
  } catch (e) {}
};
