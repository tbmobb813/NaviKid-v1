#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const infile = process.argv[2] || path.join(__dirname, 'instrumented-events.log');
const outArg = process.argv[3] || null; // optional output path
const outJsonFlag = (process.argv[4] || '').toLowerCase() === 'json' || (outArg && outArg.endsWith('.json'));
if (!fs.existsSync(infile)) {
  console.error('Input file not found:', infile);
  process.exit(2);
}
const raw = fs.readFileSync(infile, 'utf8');
const lines = raw.split(/\r?\n/).filter(Boolean);

// Parse lines expected in the format: ISO | hr JSON
function parseLine(line) {
  const m = line.match(/^(\s*(\d{4}-\d{2}-\d{2}T[^\s]+Z)) \| (\d+)\s+(\{.*\})$/);
  if (!m) return null;
  const iso = m[2];
  const hr = Number(m[3]);
  let obj = null;
  try { obj = JSON.parse(m[4]); } catch (e) { return null; }
  return { iso, hr, obj, raw: line };
}

const perInstance = {};
for (const ln of lines) {
  const rec = parseLine(ln);
  if (!rec) continue;
  const { hr, obj } = rec;
  const op = obj.op || obj.type || 'unknown';
  const instanceId = obj.instanceId != null ? String(obj.instanceId) : '__noid';
  perInstance[instanceId] = perInstance[instanceId] || { events: [] };
  const e = { hr, op, obj, raw: ln };
  // Normalize op names used in instrumentation
  if (op === 'activeOps.increment' || op === 'bumpActive.entry') e.kind = 'activeOps++';
  else if (op === 'activeOps.decrement') e.kind = 'activeOps--';
  else if (op === 'authenticate.entry') e.kind = 'authenticate.entry';
  else if (op === 'unmount.entry') e.kind = 'unmount';
  else e.kind = op;
  perInstance[instanceId].events.push(e);
}

// For each instance, sort events by hr and group activeOps events under the latest prior authenticate.entry
const report = [];
for (const [id, data] of Object.entries(perInstance)) {
  const evs = data.events.sort((a,b)=> a.hr - b.hr);
  // Collect authenticate entries
  const auths = evs.filter(e=>e.kind==='authenticate.entry');
  // Prepare buckets: each authenticate entry covers events until the next authenticate entry
  const buckets = auths.map(a=>({ auth: a, increments: [], decrements: [] }));
  // If there are no auth entries, group all ops under a special bucket
  if (buckets.length === 0) buckets.push({ auth: null, increments: [], decrements: [], others: evs });
  // Scan events and assign
  let authIndex = 0;
  for (const e of evs) {
    if (e.kind === 'authenticate.entry') {
      // advance authIndex to index of this auth entry
      authIndex = auths.findIndex(a=>a === e);
      continue;
    }
    if (e.kind === 'activeOps++') {
      buckets[Math.max(0, authIndex)].increments.push(e);
    } else if (e.kind === 'activeOps--') {
      buckets[Math.max(0, authIndex)].decrements.push(e);
    }
  }
  report.push({ instanceId: id, auths: buckets });
}

// Print report
// Optionally produce machine-readable JSON suitable for CI assertions
if (outJsonFlag) {
  const jsonReport = {
    source: infile,
    generatedAt: new Date().toISOString(),
    instances: report.map(r => ({
      instanceId: r.instanceId,
      auths: r.auths.map(b => {
        if (!b.auth) return { auth: null, increments: b.increments.length, decrements: b.decrements.length, totalEvents: (b.others||[]).length };
        return {
          hr: b.auth.hr,
          isMounted: !!(b.auth.obj && b.auth.obj.isMounted),
          increments: b.increments.map(x=>({ hr: x.hr, op: x.op })),
          decrements: b.decrements.map(x=>({ hr: x.hr, op: x.op })),
          sampleStack: b.auth.obj && b.auth.obj.stack ? String(b.auth.obj.stack).split('\n')[0] : null,
        };
      })
    }))
  };
  const outPath = outArg || path.join(__dirname, 'link_active_ops_report.json');
  fs.writeFileSync(outPath, JSON.stringify(jsonReport, null, 2), 'utf8');
  console.log('Wrote JSON report to', outPath);
} else {
  console.log('Linking report for', infile);
  for (const r of report) {
    console.log('\nInstance', r.instanceId, ':');
    if (!r.auths || r.auths.length === 0) {
      console.log('  (no events)');
      continue;
    }
    r.auths.forEach((b, i)=>{
      if (!b.auth) {
        console.log(`  <no authenticate.entry> : increments=${b.increments.length} decrements=${b.decrements.length} totalEvents=${b.others?b.others.length:0}`);
        return;
      }
      const isMounted = b.auth.obj && b.auth.obj.isMounted ? true : false;
      console.log(`  auth#${i} hr=${b.auth.hr} isMounted=${isMounted} increments=${b.increments.length} decrements=${b.decrements.length}`);
      if (b.increments.length + b.decrements.length > 0) {
        // show example stack from the auth entry if present
        if (b.auth.obj && b.auth.obj.stack) {
          const stack = String(b.auth.obj.stack).split('\n')[0];
          console.log('    auth stack (sample):', stack);
        }
      }
    });
  }
  console.log('\nDone.');
}
