#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const file = process.argv[2] || path.join(__dirname, 'parental-act-prefix15.log');
if (!fs.existsSync(file)) {
  console.error('Log file not found:', file);
  process.exit(2);
}
const raw = fs.readFileSync(file, 'utf8');
const lines = raw.split(/\r?\n/);
const events = [];
function parseHead(line) {
  // Try to capture leading ISO and hrtime: "2025-11-29T03:23:27.475Z | 4642729897188"
  const m = line.match(/^(\d{4}-\d{2}-\d{2}T[^\s]+Z) \| (\d+)/);
  if (m) return { iso: m[1], hr: Number(m[2]) };
  // Fallback: look for first [ISO] inside line and hr after |
  const m2 = line.match(/\[(\d{4}-\d{2}-\d{2}T[^\]]+Z)\].*\|\s*(\d+)/);
  if (m2) return { iso: m2[1], hr: Number(m2[2]) };
  // Final fallback: try any ISO
  const m3 = line.match(/(\d{4}-\d{2}-\d{2}T[^\s]+Z)/);
  return { iso: m3 ? m3[1] : null, hr: null };
}
for (const line of lines) {
  if (!line) continue;
  const head = parseHead(line);
  const hr = head.hr;
  const iso = head.iso;
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
      events.push({ hr, iso, type: 'activeOps++', detail: json || {}, raw: line });
      continue;
    }
    if (line.includes('parentalStore activeOps decrement')) {
      events.push({ hr, iso, type: 'activeOps--', detail: json || {}, raw: line });
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
      console.log(`  -> Found activeOps decrement after unmount at hr=${lateDec.hr} (possible op finishing after unmount)`);
    } else {
      console.log('  -> No activeOps decrement after last unmount detected');
    }
  }
}
// Count overlap warnings
const overlaps = sorted.filter(e=>e.type==='overlap-warning').length;
console.log(`\nOverlap warnings found: ${overlaps}`);
console.log('\nDone.');
