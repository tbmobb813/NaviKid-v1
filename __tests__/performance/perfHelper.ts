import { recordTiming } from '../../tools/perfRecorder';

export async function measureAndRecord(testName: string, fn: () => Promise<any> | any) {
  const start = Date.now();
  let res;
  try {
    res = await fn();
  } finally {
    const ms = Date.now() - start;
    try {
      recordTiming(testName, ms);
    } catch (e) {
      // swallow
    }
  }
  return res;
}

// NOTE: This file lives under __tests__ to keep performance helpers colocated
// with perf specs. Jest will treat it as a test file if it has no tests which
// results in "Your test suite must contain at least one test.". Add a small
// benign test so Jest doesn't error when loading this helper in isolation.
if (typeof test === 'function') {
  test('perfHelper helper (sanity)', () => {
    expect(typeof measureAndRecord).toBe('function');
  });
}
