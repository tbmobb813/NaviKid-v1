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

  // Prefer `eslint_d` daemon for speed if available in node_modules/.bin.
  // Otherwise try local eslint bin; if that fails, fall back to `npx eslint`.
  const fs = require('fs');
  const binDir = path.join(process.cwd(), 'node_modules', '.bin');
  const eslintDPath = path.join(binDir, process.platform === 'win32' ? 'eslint_d.cmd' : 'eslint_d');
  const eslintBinPath = path.join(binDir, process.platform === 'win32' ? 'eslint.cmd' : 'eslint');
  let useNpx = false;
  let spawnCmd;
  let spawnArgs = [];
  if (fs.existsSync(eslintDPath)) {
    spawnCmd = eslintDPath;
  } else {
    try {
      // resolve eslint JS entry
      const eslintJs = require.resolve('eslint/bin/eslint.js', { paths: [process.cwd()] });
      spawnCmd = process.execPath;
      spawnArgs.push(eslintJs);
    } catch (err) {
      // fallback to npx
      useNpx = true;
    }
  }

  const userArgs = process.argv.slice(2);
  const defaultArgs = ['**/*.{ts,tsx}', '--max-warnings=0'];
  let args = userArgs.length ? [...userArgs] : defaultArgs.slice();

  // Ensure caching is enabled by default unless explicitly disabled
  const hasCache = args.some((a) => a === '--cache' || a === '--no-cache' || a === '--cache-location');
  if (!hasCache) {
    args.push('--cache', '--cache-location', '.cache/eslint/default');
  }

  let child;

  // Spinner / heartbeat so long-running lint runs show activity
  const spinner = ['|', '/', '-', '\\'];
  let idx = 0;
  let heartbeat = 0;
  const spinInterval = setInterval(() => {
    try {
      process.stdout.write(`\r[lint] ${spinner[idx++ % spinner.length]} Working...`);
      heartbeat += 1;
      if (heartbeat % 10 === 0) {
        const now = new Date().toISOString();
        process.stdout.write(`  ${now}`);
      }
    } catch (e) {
      // ignore write errors
    }
  }, 100);
  if (useNpx) {
    // Spawn `npx eslint ...`
    child = spawn('npx', ['eslint', ...args], {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: process.env,
    });
  } else {
    if (spawnCmd && spawnCmd.endsWith('eslint_d')) {
      // eslint_d binary supports being invoked directly with args
      child = spawn(spawnCmd, args, {
        stdio: 'inherit',
        cwd: process.cwd(),
        env: process.env,
      });
    } else if (spawnCmd === process.execPath) {
      // we resolved eslint JS; spawn node with the resolved file
      child = spawn(process.execPath, [...spawnArgs, ...args], {
        stdio: 'inherit',
        cwd: process.cwd(),
        env: process.env,
      });
    } else if (fs.existsSync(eslintBinPath)) {
      // fallback to node_modules/.bin/eslint
      child = spawn(eslintBinPath, args, {
        stdio: 'inherit',
        cwd: process.cwd(),
        env: process.env,
      });
    } else {
      // ultimate fallback to npx
      child = spawn('npx', ['eslint', ...args], {
        stdio: 'inherit',
        cwd: process.cwd(),
        env: process.env,
      });
    }
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
    clearInterval(spinInterval);
    try { process.stdout.clearLine(); process.stdout.cursorTo(0); } catch (e) {}
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
    clearInterval(spinInterval);
    console.error('Failed to start ESLint:', err && err.message ? err.message : err);
    process.exit(2);
  });
}

main();
