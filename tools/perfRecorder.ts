import fs from 'fs';
import path from 'path';

const outPath = path.resolve(__dirname, '..', 'coverage', 'perf-timings.json');

export function recordTiming(testName: string, ms: number) {
  try {
    const dir = path.dirname(outPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    let data: Record<string, number[]> = {};
    if (fs.existsSync(outPath)) {
      const raw = fs.readFileSync(outPath, 'utf8');
      try {
        data = JSON.parse(raw) as Record<string, number[]>;
      } catch (e) {
        // overwrite on parse failure
        data = {};
      }
    }

    if (!data[testName]) data[testName] = [];
    data[testName].push(ms);

    // Keep only last 50 entries per test to limit file size
    if (data[testName].length > 50) data[testName] = data[testName].slice(-50);

    // Write atomically: write to a temp file then rename into place.
    const tempPath = `${outPath}.tmp-${process.pid}-${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempPath, outPath);
  } catch (err) {
    // Do not fail tests if recording fails; log to console to avoid added deps
    const e: any = err;
    // Use console.warn instead of a logger to avoid pulling runtime deps into tools
    console.warn('perfRecorder: failed to record timing', e && e.message ? e.message : e);
  }
}
