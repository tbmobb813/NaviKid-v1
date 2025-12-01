import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

describe('link_active_ops_to_auth linker (unit)', () => {
  const fixture = path.join(__dirname, '..', '.test-debug', 'fixtures', 'sample-1.log');
  const out = path.join(__dirname, '..', '.test-debug', 'fixtures', 'sample-1.report.json');

  beforeAll(() => {
    try { fs.unlinkSync(out); } catch (e) { /* ignore */ }
  });

  test('produces JSON report with expected counts for fixture', () => {
    // Run the linker on the fixture and produce JSON output
    const exe = path.join(__dirname, '..', '.test-debug', 'link_active_ops_to_auth.cjs');
    const cmd = `node ${exe} ${fixture} ${out} json`;
    execSync(cmd, { stdio: 'inherit' });
    expect(fs.existsSync(out)).toBe(true);
    const content = fs.readFileSync(out, 'utf8');
    const json = JSON.parse(content);
    expect(json).toHaveProperty('instances');
    const inst = json.instances.find((i: any) => String(i.instanceId) === '1');
    expect(inst).toBeDefined();
    // Our fixture has one authenticate.entry and two decrements (one before and one after unmount)
    const auth = inst.auths[0];
    expect(auth).toBeDefined();
    // increments: 1, decrements: 2
    expect(auth.increments.length).toBe(1);
    expect(auth.decrements.length).toBe(2);
  });
});
