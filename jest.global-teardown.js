const fs = require('fs');
const path = require('path');
const os = require('os');

const PID_FILE = path.join(os.tmpdir(), 'navikid-backend.pid');
const CONTAINER_FILE = path.join(os.tmpdir(), 'navikid-postgres-container');

module.exports = async function globalTeardown() {
  try {
    if (!fs.existsSync(PID_FILE)) return;
    const pid = Number(fs.readFileSync(PID_FILE, 'utf8'));
    if (Number.isFinite(pid)) {
      try {
        process.kill(pid);
        console.log('Stopped backend process', pid);
      } catch (e) {
        console.warn('Failed to kill backend process', pid, e?.message ?? e);
      }
    }
    fs.unlinkSync(PID_FILE);
    // Stop postgres container if present
    try {
      if (fs.existsSync(CONTAINER_FILE)) {
        const containerName = fs.readFileSync(CONTAINER_FILE, 'utf8').trim();
        const { spawnSync } = require('child_process');
        spawnSync('docker', ['stop', containerName], { stdio: 'inherit' });
        try { fs.unlinkSync(CONTAINER_FILE); } catch (e) {}
      }
    } catch (e) {
      // ignore
    }
  } catch (e) {
    // ignore teardown errors
    console.warn('globalTeardown error', e?.message ?? e);
  }
};
