const fs = require('fs');
const path = require('path');
const os = require('os');

const PID_FILE = path.join(os.tmpdir(), 'navikid-backend.pid');
const CONTAINER_FILE = path.join(os.tmpdir(), 'navikid-postgres-container');

async function killAndWait(pid, timeoutMs = 5000) {
  const { promisify } = require('util');
  const sleep = promisify(setTimeout);
  try {
    process.kill(pid, 'SIGTERM');
  } catch (e) {
    // may already be dead
  }
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      // check if process exists
      process.kill(pid, 0);
      // still alive
      await sleep(200);
    } catch (e) {
      // process does not exist
      return true;
    }
  }
  // force kill
  try {
    process.kill(pid, 'SIGKILL');
  } catch (e) {}
  // final check
  try {
    process.kill(pid, 0);
    return false;
  } catch (e) {
    return true;
  }
}

module.exports = async function globalTeardown() {
  try {
    if (fs.existsSync(PID_FILE)) {
      const pid = Number(fs.readFileSync(PID_FILE, 'utf8'));
      if (Number.isFinite(pid)) {
        const stopped = await killAndWait(pid, 5000);
        if (stopped) {
          console.log('Stopped backend process', pid);
        } else {
          console.warn('Failed to stop backend process', pid);
        }
      }
      try { fs.unlinkSync(PID_FILE); } catch (e) {}
    }

    // Stop docker compose stack or individual container if present
    try {
      if (fs.existsSync(CONTAINER_FILE)) {
        const containerMarker = fs.readFileSync(CONTAINER_FILE, 'utf8').trim();
        const { spawnSync } = require('child_process');
        if (containerMarker === 'compose') {
          const composeFile = path.join(__dirname, 'docker', 'docker-compose.test.yml');
          spawnSync('docker', ['compose', '-f', composeFile, 'down', '--remove-orphans'], { stdio: 'inherit' });
        } else if (containerMarker) {
          spawnSync('docker', ['stop', containerMarker], { stdio: 'inherit' });
        }
        try { fs.unlinkSync(CONTAINER_FILE); } catch (e) {}
      }
    } catch (e) {
      // ignore container stop errors
    }
  } catch (e) {
    console.warn('globalTeardown error', e?.message ?? e);
  }
};
