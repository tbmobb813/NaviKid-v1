#!/usr/bin/env node
const { spawn } = require('child_process');
const glob = require('glob');

const TIMEOUT_MS = parseInt(process.env.LINT_TIMEOUT_MS, 10) || 30000; // 30s default per file

function padPrefix(prefix) {
  return `[${prefix}] `;
}

function lintFile(file, timeoutMs) {
  return new Promise((resolve) => {
    const cmd = 'npx';
    const args = ['eslint', file, '--max-warnings=0', '-f', 'stylish'];

    console.log(`${padPrefix('lint')}Linting ${file} (timeout ${timeoutMs}ms)`);

    const proc = spawn(cmd, args, { shell: false });

    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try { proc.kill('SIGKILL'); } catch (e) {}
      console.error(`${padPrefix('lint')}TIMEOUT: ${file} exceeded ${timeoutMs}ms`);
      resolve({ file, status: 'timeout' });
    }, timeoutMs);

    proc.stdout.on('data', (d) => process.stdout.write(d.toString()));
    proc.stderr.on('data', (d) => process.stderr.write(d.toString()));

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (timedOut) return; // already resolved on timeout
      if (code === 0) {
        console.log(`${padPrefix('lint')}OK: ${file}`);
        resolve({ file, status: 'ok' });
      } else {
        console.error(`${padPrefix('lint')}ERR(${code}): ${file}`);
        resolve({ file, status: 'error', code });
      }
    });
  });
}

function findFiles() {
  // prefer backend files if they exist
  const backendPattern = 'backend/src/**/*.{ts,tsx}';
  const rootPattern = 'src/**/*.{ts,tsx}';
  let files = glob.sync(backendPattern, { nodir: true });
  if (!files || files.length === 0) {
    files = glob.sync(rootPattern, { nodir: true });
  }
  // dedupe & sort
  files = Array.from(new Set(files)).sort();
  return files;
}

(async function main() {
  const files = findFiles();
  if (!files || files.length === 0) {
    console.log(`${padPrefix('lint')}No files found to lint`);
    process.exit(0);
  }

  console.log(`${padPrefix('lint')}Found ${files.length} files; running per-file lint with ${TIMEOUT_MS}ms timeout`);

  const results = [];
  for (const f of files) {
    // eslint-disable-next-line no-await-in-loop
    const r = await lintFile(f, TIMEOUT_MS);
    results.push(r);
  }

  const failed = results.filter((r) => r.status !== 'ok');
  console.log(`${padPrefix('lint')}Summary: ${results.length} files, ${failed.length} failed/timeouts`);
  if (failed.length > 0) {
    process.exit(2);
  }
  process.exit(0);
})();
