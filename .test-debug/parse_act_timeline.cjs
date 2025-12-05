#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const file = process.argv[2] || path.join(__dirname, 'parental-act-prefix15.log');
if (!fs.existsSync(file)) {
  console.error('Log file not found:', file);
  process.exit(2);
}
const raw = fs.readFileSync(file, 'utf8');
// Jest sometimes prints the timestamp on a separate indented line following a console.* label.
// Coalesce lines where a line is just an ISO timestamp and hrtime so we treat them as a single record.
const rawLines = raw.split(/\r?\n/);
const lines = [];
for (let i = 0; i < rawLines.length; i++) {
  const ln = rawLines[i];
  const isoLineMatch = ln.match(/^\s*(\d{4}-\d{2}-\d{2}T[^\s]+Z) \| (\d+)/);
  if (isoLineMatch && lines.length > 0) {
    // append to previous line to create a single logical line
    lines[lines.length - 1] = lines[lines.length - 1] + ' ' + ln.trim();
  } else {
    lines.push(ln);
  }
}
const events = [];
function parseHead(line) {
  // Prefer ISO timestamp anywhere in the line; use Date.parse to get ms since epoch as ordering key.
  const m = line.match(/(\d{4}-\d{2}-\d{2}T[^\s]+Z)/);
  if (m) {
    const iso = m[1];
    const ms = Date.parse(iso);
    if (!Number.isNaN(ms)) return { iso, hr: ms };
    return { iso, hr: null };
  }
  // If no ISO, try to find a long integer (hrtime) anywhere
  const n = line.match(/\|?\s*(\d{9,})/);
  if (n) return { iso: null, hr: Number(n[1]) };
  return { iso: null, hr: null };
}
for (const line of lines) {
  if (!line) continue;
  const head = parseHead(line);
  const hr = head.hr;
  const iso = head.iso;
  // If the line looks like the JSON-per-line instrumentation we write from
  // `emitTestDebug`, prefer to parse the JSON directly rather than relying
  // on human-formatted text. Format: ISO | HR { ...json... }
  const jsonLineMatch = line.match(/^(\s*(\d{4}-\d{2}-\d{2}T[^\s]+Z))\s*\|\s*(\d+)\s+(\{[\s\S]*\})$/);
  if (jsonLineMatch) {
    try {
      const obj = JSON.parse(jsonLineMatch[4]);
      const op = obj.op || obj.type || 'unknown';
      if (op === 'authenticate.entry') {
        events.push({ hr: Number(jsonLineMatch[3]), iso: jsonLineMatch[1], type: 'authenticate.entry', detail: obj, raw: line });
        continue;
      }
      if (op === 'activeOps.increment' || op === 'bumpActive.entry' || op === 'activeOps.increment_after_unmount') {
        const after = op === 'activeOps.increment_after_unmount';
        events.push({ hr: Number(jsonLineMatch[3]), iso: jsonLineMatch[1], type: 'activeOps++', afterUnmount: after, detail: obj, raw: line });
        continue;
      }
      if (op === 'activeOps.decrement' || op === 'activeOps.decrement_noop_after_unmount') {
        const after = op === 'activeOps.decrement_noop_after_unmount';
        events.push({ hr: Number(jsonLineMatch[3]), iso: jsonLineMatch[1], type: 'activeOps--', afterUnmount: after, detail: obj, raw: line });
        continue;
      }
      if (op === 'unmount.entry') {
        events.push({ hr: Number(jsonLineMatch[3]), iso: jsonLineMatch[1], type: 'unmounted', detail: obj, raw: line });
        continue;
      }
      // fallback: store generic object event so downstream quick checks can still see instanceId
      events.push({ hr: Number(jsonLineMatch[3]), iso: jsonLineMatch[1], type: op, detail: obj, raw: line });
      continue;
    } catch (e) {
      // fall through to legacy parsing
    }
  }
  // Patterns
  if (line.includes('[TestDebug][ACT-START]') || line.includes('[ACT-START]')) {
    const rest = line.split('[ACT-START]')[1] || line.split('[TestDebug][ACT-START]')[1] || '';
    events.push({ hr, iso, type: 'ACT-START', detail: rest.trim(), raw: line });
    continue;
  }
  if (line.includes('[TestDebug][ACT-END]') || line.includes('[ACT-END]') || line.includes('[ACT-END-ERR]')) {
    const key = (line.includes('[ACT-END-ERR]') ? '[ACT-END-ERR]' : '[ACT-END]');
    const rest = line.split(key)[1] || '';
    events.push({ hr, iso, type: key.replace(/\[|\]/g, ''), detail: rest.trim(), raw: line });
    continue;
  }
  if (line.includes('parentalStore')) {
    // extract JSON-like prefix if present
    const jmatch = line.match(/(\{[^\}]*\})/);
    let json = null;
    if (jmatch) {
      try { json = JSON.parse(jmatch[1]); } catch (e) { /* ignore */ }
    }
    if (line.includes('parentalStore mounted')) {
      events.push({ hr, iso, type: 'mounted', detail: json || {}, raw: line });
      continue;
    }
    if (line.includes('parentalStore unmounted')) {
      events.push({ hr, iso, type: 'unmounted', detail: json || {}, raw: line });
      continue;
    }
    if (line.includes('parentalStore activeOps increment')) {
      const after = line.includes('after unmount');
      events.push({ hr, iso, type: 'activeOps++', afterUnmount: after, detail: json || {}, raw: line });
      continue;
    }
    if (line.includes('parentalStore activeOps decrement')) {
      const after = line.includes('after unmount');
      events.push({ hr, iso, type: 'activeOps--', afterUnmount: after, detail: json || {}, raw: line });
      continue;
    }
    if (line.includes('authenticate.entry') || line.includes('parentalStore authenticate')) {
      // capture authenticate entry events (contains isMounted in detail when instrumented)
      events.push({ hr, iso, type: 'authenticate.entry', detail: json || {}, raw: line });
      continue;
    }
    if (line.includes('parentalStore.loadData start')) {
      events.push({ hr, iso, type: 'loadData start', detail: json || {}, raw: line });
      continue;
    }
    if (line.includes('parentalStore.loadData end')) {
      events.push({ hr, iso, type: 'loadData end', detail: json || {}, raw: line });
      continue;
    }
  }
  if (line.includes('You seem to have overlapping act() calls')) {
    events.push({ hr, iso, type: 'overlap-warning', detail: {}, raw: line });
    continue;
  }
}
// Sort events by hr when available, otherwise keep original order
const eventsWithHr = events.filter(e => Number.isFinite(e.hr));
const eventsNoHr = events.filter(e => !Number.isFinite(e.hr));
eventsWithHr.sort((a,b)=> a.hr - b.hr);
const sorted = eventsWithHr.concat(eventsNoHr);
if (sorted.length === 0) {
  console.log('No events found.');
  process.exit(0);
}
const firstHr = sorted.find(e=>Number.isFinite(e.hr)).hr;
console.log('Parsed', sorted.length, 'events from', file);
console.log('Relative timeline (ms from first event):\n');
for (const ev of sorted) {
  const rel = ev.hr ? ((ev.hr - firstHr)/1e6).toFixed(3) + ' ms' : 'N/A';
  let info = ev.type;
  if (ev.detail && typeof ev.detail === 'object' && Object.keys(ev.detail).length) info += ' ' + JSON.stringify(ev.detail);
  console.log(`${rel.padStart(12)} | ${ev.hr || ''} | ${info} | ${ev.raw.replace(/\s+/g,' ').slice(0,200)}`);
}
// Quick checks: ops finishing after unmount per instanceId
const perInstance = {};
for (const ev of sorted) {
  const id = ev.detail && ev.detail.instanceId != null ? String(ev.detail.instanceId) : '__noid';
  perInstance[id] = perInstance[id] || { events: [] };
  perInstance[id].events.push(ev);
}
console.log('\nQuick checks per instance:');
for (const [id, data] of Object.entries(perInstance)) {
  const evs = data.events;
  const unmounts = evs.filter(e=>e.type==='unmounted');
  const decrements = evs.filter(e=>e.type==='activeOps--');
  const increments = evs.filter(e=>e.type==='activeOps++');
  const mounted = evs.filter(e=>e.type==='mounted');
  console.log(`\nInstance ${id}: mounted=${mounted.length} increments=${increments.length} decrements=${decrements.length} unmounts=${unmounts.length}`);
  // Check if any decrement occurs after the last unmount
  if (unmounts.length) {
    const lastUnmountHr = unmounts[unmounts.length-1].hr || 0;
    const lateDec = decrements.find(d=> (d.hr || 0) > lastUnmountHr);
    if (lateDec) {
      if (lateDec.afterUnmount) {
        console.log(`  -> Found activeOps decrement after unmount at hr=${lateDec.hr} (explicitly logged with "after unmount")`);
      } else {
        console.log(`  -> Found activeOps decrement after unmount at hr=${lateDec.hr} (possible op finishing after unmount)`);
      }
    } else {
      console.log('  -> No activeOps decrement after last unmount detected');
    }
  }
}
// Count overlap warnings
const overlaps = sorted.filter(e=>e.type==='overlap-warning').length;
console.log(`\nOverlap warnings found: ${overlaps}`);
console.log('\nDone.');
