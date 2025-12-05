#!/usr/bin/env node
/**
 * Linker fixture test runner (Node-based, no Jest global setup).
 * Runs the linker on small fixture files and asserts expected JSON output.
 * Exits non-zero on assertion failure for CI integration.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const fixtures = [
  {
    name: 'sample-1',
    input: path.join(__dirname, 'fixtures', 'sample-1.log'),
    output: path.join(__dirname, 'fixtures', 'sample-1.report.json'),
    expectations: {
      instanceId: '1',
      authCount: 1,
      incrementCount: 1,
      decrementCount: 2,
    },
  },
];

let exitCode = 0;

for (const fixture of fixtures) {
  console.log(`\n[Fixture Test] ${fixture.name}`);
  
  // Clean previous output
  try {
    if (fs.existsSync(fixture.output)) fs.unlinkSync(fixture.output);
  } catch (e) {
    // ignore
  }

  // Run linker
  try {
    const linkerPath = path.join(__dirname, 'link_active_ops_to_auth.cjs');
    const cmd = `node ${linkerPath} ${fixture.input} ${fixture.output} json`;
    execSync(cmd, { stdio: 'inherit' });
  } catch (e) {
    console.error(`[FAIL] Linker execution failed for ${fixture.name}`);
    exitCode = 1;
    continue;
  }

  // Read and parse output
  if (!fs.existsSync(fixture.output)) {
    console.error(`[FAIL] Output file not created: ${fixture.output}`);
    exitCode = 1;
    continue;
  }

  let json;
  try {
    const content = fs.readFileSync(fixture.output, 'utf8');
    json = JSON.parse(content);
  } catch (e) {
    console.error(`[FAIL] Failed to parse output JSON: ${e.message}`);
    exitCode = 1;
    continue;
  }

  // Assert expectations
  const inst = json.instances.find((i) => String(i.instanceId) === fixture.expectations.instanceId);
  if (!inst) {
    console.error(`[FAIL] Instance ${fixture.expectations.instanceId} not found in output`);
    exitCode = 1;
    continue;
  }

  if (inst.auths.length !== fixture.expectations.authCount) {
    console.error(`[FAIL] Expected ${fixture.expectations.authCount} auth buckets, got ${inst.auths.length}`);
    exitCode = 1;
    continue;
  }

  const auth = inst.auths[0];
  if (auth.increments.length !== fixture.expectations.incrementCount) {
    console.error(`[FAIL] Expected ${fixture.expectations.incrementCount} increments, got ${auth.increments.length}`);
    exitCode = 1;
    continue;
  }

  if (auth.decrements.length !== fixture.expectations.decrementCount) {
    console.error(`[FAIL] Expected ${fixture.expectations.decrementCount} decrements, got ${auth.decrements.length}`);
    exitCode = 1;
    continue;
  }

  console.log(`[PASS] ${fixture.name}`);
}

if (exitCode === 0) {
  console.log('\n✓ All linker fixture tests passed');
} else {
  console.error('\n✗ Some linker fixture tests failed');
}

process.exit(exitCode);
