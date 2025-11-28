#!/usr/bin/env node
const { spawn } = require('child_process');
const glob = require('glob');

const TIMEOUT_MS = parseInt(process.env.LINT_TIMEOUT_MS, 10) || 30000; // 30s default per file

function padPrefix(prefix) {
  return `[${prefix}] `;
}

function lintFile(file, timeoutMs) {
  return new Promise((resolve) => {
    // Prefer running the local eslint binary directly to avoid `npx` startup
    // overhead which can be significant when linting many files serially.
    let proc;
    try {
      // Prefer eslint_d from node_modules/.bin if present for daemon speed.
      const path = require('path');
      const eslintdBin = path.join(process.cwd(), 'node_modules', '.bin', 'eslint_d');
      // Attempt to spawn eslint_d directly (fast). If it doesn't exist, this will fail and fall through.
      proc = spawn(eslintdBin, [file, '--max-warnings=0', '-f', 'stylish'], { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
      try {
        const eslintBin = require.resolve('eslint/bin/eslint.js', { paths: [process.cwd()] });
        const node = process.execPath;
        const args = [eslintBin, file, '--max-warnings=0', '-f', 'stylish'];
        console.log(`${padPrefix('lint')}Linting ${file} (timeout ${timeoutMs}ms)`);
        proc = spawn(node, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      } catch (err) {
        // Fallback to npx if local eslint cannot be resolved
        const cmd = 'npx';
        const args = ['eslint', file, '--max-warnings=0', '-f', 'stylish'];
        console.warn(`${padPrefix('lint')}Falling back to npx for ${file}: ${err && err.message}`);
        proc = spawn(cmd, args, { shell: false });
      }
    }

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

  console.log(`${padPrefix('lint')}Found ${files.length} files`);

  // If there are many files, prefer a single batched ESLint invocation to
  // avoid per-file `npx`/spawn overhead which can be extremely slow. This
  // keeps CI and developer runs fast and reliable.
  const BATCH_THRESHOLD = 20;
  if (files.length > BATCH_THRESHOLD) {
    console.log(`${padPrefix('lint')}Running batched ESLint for ${files.length} files (threshold ${BATCH_THRESHOLD})`);

    // Try to resolve local eslint bin, otherwise fall back to npx
    let useNpx = false;
    let eslintBin;
    try {
      eslintBin = require.resolve('eslint/bin/eslint.js', { paths: [process.cwd()] });
    } catch (e) {
      useNpx = true;
    }

    const { spawn } = require('child_process');
    const args = ['backend/src', '--ext', '.ts,.tsx', '--max-warnings=0', '--config', 'backend/.eslintrc.cjs'];
    let child;
    if (useNpx) {
      child = spawn('npx', ['eslint', ...args], { stdio: 'inherit', cwd: process.cwd(), env: process.env });
    } else {
      child = spawn(process.execPath, [eslintBin, ...args], { stdio: 'inherit', cwd: process.cwd(), env: process.env });
    }

    const timer = setTimeout(() => {
      try { child.kill('SIGKILL'); } catch (e) {}
      console.error(`${padPrefix('lint')}Batched ESLint timed out after ${TIMEOUT_MS}ms`);
      process.exit(124);
    }, TIMEOUT_MS);

    child.on('exit', (code) => {
      clearTimeout(timer);
      if (code === 0) process.exit(0);
      console.error(`${padPrefix('lint')}Batched ESLint failed with exit code ${code}`);
      process.exit(code === null ? 1 : code);
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      console.error(`${padPrefix('lint')}Failed to start batched ESLint: ${err && err.message ? err.message : err}`);
      process.exit(2);
    });
    return;
  }

  console.log(`${padPrefix('lint')}Running per-file lint with ${TIMEOUT_MS}ms timeout`);

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
