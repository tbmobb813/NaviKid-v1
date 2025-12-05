#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const infile = process.argv[2] || path.join(__dirname, 'instrumented-events.log');
const outfile = process.argv[3] || path.join(__dirname, 'instrumented-events-for-parser.log');
if (!fs.existsSync(infile)) {
  console.error('Input file not found:', infile);
  process.exit(2);
}
const raw = fs.readFileSync(infile, 'utf8');
const lines = raw.split(/\r?\n/).filter(Boolean);
const out = [];
for (const line of lines) {
  // Expect format: ISO | hr JSON
  const m = line.match(/^(\s*\d{4}-\d{2}-\d{2}T[^\s]+Z) \| (\d+)\s+(\{.*\})$/);
  if (!m) continue;
  const iso = m[1];
  const hr = m[2];
  let json = m[3];
  let obj = null;
  try { obj = JSON.parse(json); } catch (e) { continue; }
  const op = obj.op || obj.type || 'unknown';
  // Map op to parser-friendly human line containing 'parentalStore'
  let verb = op;
  if (op === 'activeOps.increment') verb = 'activeOps increment';
  else if (op === 'activeOps.decrement') verb = 'activeOps decrement';
  else if (op === 'activeOps.increment_after_unmount') verb = 'activeOps increment after unmount';
  else if (op === 'activeOps.decrement_noop_after_unmount') verb = 'activeOps decrement after unmount';
  else if (op === 'unmount.entry') verb = 'unmounted';
  else if (op === 'bumpActive.entry') verb = 'bumpActive.entry';
  else if (op === 'authenticate.entry') verb = 'authenticate.entry';
  else if (op === 'clearSessionTimeout') verb = 'clearSessionTimeout';
  else if (op === 'startSessionTimeout_skipped') verb = 'startSessionTimeout_skipped';
  // Compose a human-parsable line the existing parser recognizes (includes 'parentalStore').
  // Prefix with [TestDebug] to avoid the parser's iso-line coalescing heuristic that
  // merges adjacent ISO-only lines into a single logical line.
  const human = `[TestDebug] ${iso} | ${hr} parentalStore ${verb} ${JSON.stringify(obj)}`;
  out.push(human);
}
fs.writeFileSync(outfile, out.join('\n') + '\n', 'utf8');
console.log('Wrote', out.length, 'lines to', outfile);
