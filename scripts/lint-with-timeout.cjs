#!/usr/bin/env node
/**
 * lint-with-timeout.cjs
 *
 * Run ESLint with a configurable timeout. If ESLint doesn't exit within the
 * timeout the process will be killed and a non-zero exit code returned.
 *
 * Usage:
 *   LINT_TIMEOUT_MS=60000 node ./scripts/lint-with-timeout.cjs [eslint args...]
 */

const { spawn } = require('child_process');
const path = require('path');

const DEFAULT_TIMEOUT = 60_000; // 60s

function getTimeoutMs() {
  const v = process.env.LINT_TIMEOUT_MS;
  if (!v) return DEFAULT_TIMEOUT;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TIMEOUT;
}

async function main() {
  const timeoutMs = getTimeoutMs();

  // Try to resolve a local eslint binary; fall back to using `npx eslint` if
  // the package's exports do not expose the bin file (some newer eslint
  // packages don't allow require.resolve on the bin path).
  let useNpx = false;
  let eslintBin;
  try {
    eslintBin = require.resolve('eslint/bin/eslint.js', { paths: [process.cwd()] });
  } catch (err) {
    // Fallback to npx if resolution fails
    useNpx = true;
  }

  const userArgs = process.argv.slice(2);
  const defaultArgs = ['**/*.{ts,tsx}', '--max-warnings=0'];
  const args = userArgs.length ? userArgs : defaultArgs;

  let child;
  if (useNpx) {
    // Spawn `npx eslint ...`
    child = spawn('npx', ['eslint', ...args], {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: process.env,
    });
  } else {
    // Spawn Node with the local eslint JS file
    child = spawn(process.execPath, [eslintBin, ...args], {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: process.env,
    });
  }


  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    try {
      console.error(`\nESLint did not finish within ${timeoutMs}ms — killing process.`);
      child.kill('SIGTERM');
    } catch (e) {
      // ignore
    }
  }, timeoutMs);

  child.on('exit', (code, signal) => {
    clearTimeout(timer);
    if (timedOut) {
      console.error('ESLint timed out');
      process.exit(124);
    }
    if (signal) {
      console.error(`ESLint terminated by signal: ${signal}`);
      process.exit(2);
    }
    process.exit(code === null ? 1 : code);
  });

  child.on('error', (err) => {
    clearTimeout(timer);
    console.error('Failed to start ESLint:', err && err.message ? err.message : err);
    process.exit(2);
  });
}

main();
