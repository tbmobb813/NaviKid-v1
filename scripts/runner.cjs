#!/usr/bin/env node
const { spawn } = require('child_process');

function padPrefix(prefix) {
  return `[${prefix}] `;
}

function run(command, prefix = 'run') {
  console.log(`${padPrefix(prefix)}Starting: ${command}`);

  const spinner = ['|', '/', '-', '\\'];
  let idx = 0;
  let heartbeat = 0;
  const spinInterval = setInterval(() => {
    process.stdout.write(`\r${padPrefix(prefix)}${spinner[idx++ % spinner.length]} Working...`);
    heartbeat += 1;
    if (heartbeat % 10 === 0) {
      const now = new Date().toISOString();
      process.stdout.write(`  ${now}`);
    }
  }, 100);

  const proc = spawn(command, { shell: true });

  proc.stdout.on('data', (data) => {
    try { process.stdout.clearLine(); process.stdout.cursorTo(0); } catch (e) {}
    data.toString().split(/\r?\n/).filter(Boolean).forEach((line) => console.log(`${padPrefix(prefix)}${line}`));
  });

  proc.stderr.on('data', (data) => {
    try { process.stdout.clearLine(); process.stdout.cursorTo(0); } catch (e) {}
    data.toString().split(/\r?\n/).filter(Boolean).forEach((line) => console.error(`${padPrefix(prefix)}ERR: ${line}`));
  });

  proc.on('close', (code) => {
    clearInterval(spinInterval);
    try { process.stdout.clearLine(); process.stdout.cursorTo(0); } catch (e) {}
    if (code === 0) {
      console.log(`${padPrefix(prefix)}Completed successfully (exit ${code})`);
      process.exit(0);
    } else {
      console.error(`${padPrefix(prefix)}Failed with exit code ${code}`);
      process.exit(code);
    }
  });
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) { console.error('Usage: runner.cjs "<command>" [prefix]'); process.exit(2); }
  const command = args[0];
  const prefix = args[1] || 'run';
  run(command, prefix);
}

module.exports = { run };
