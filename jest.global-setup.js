const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Use deterministic temp file paths so teardown can find them reliably.
const PID_FILE = path.join(os.tmpdir(), 'navikid-backend.pid');
const CONTAINER_FILE = path.join(os.tmpdir(), 'navikid-postgres-container');
const HEALTH_URL = 'http://localhost:3000/health';

function waitForHealth(timeoutMs = 30000, intervalMs = 500) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function poll() {
      // Use global fetch available in Node 18+
      fetch(HEALTH_URL)
        .then((r) => {
          if (r.ok) return resolve();
          if (Date.now() - start > timeoutMs) return reject(new Error('timeout waiting for backend health'));
          setTimeout(poll, intervalMs);
        })
        .catch(() => {
          if (Date.now() - start > timeoutMs) return reject(new Error('timeout waiting for backend health'));
          setTimeout(poll, intervalMs);
        });
    })();
  });
}

module.exports = async function globalSetup() {
  // Only start backend if backend has a start script and user didn't disable via env
  if (process.env.SKIP_START_BACKEND === '1') {
    return;
  }

  const backendDir = path.join(__dirname, 'backend');
  if (!fs.existsSync(path.join(backendDir, 'package.json'))) return;

  // Build backend so dist/server.js exists
  // Ensure backend dependencies are installed (helps CI and fresh checkouts).
  // Can be skipped by setting SKIP_INSTALL_BACKEND=1 in the environment.
  const backendNodeModules = path.join(backendDir, 'node_modules');
  if (!process.env.SKIP_INSTALL_BACKEND && !fs.existsSync(backendNodeModules)) {
    console.log('backend/node_modules not present — installing backend dependencies (npm ci)...');
    await new Promise((resolve, reject) => {
      const install = spawn('npm', ['ci'], { cwd: backendDir, stdio: 'inherit' });
      install.on('close', (code) => (code === 0 ? resolve() : reject(new Error('backend npm ci failed'))));
    });
  }

  await new Promise((resolve, reject) => {
    const build = spawn('npm', ['run', 'build'], { cwd: backendDir, stdio: 'inherit' });
    build.on('close', (code) => (code === 0 ? resolve() : reject(new Error('backend build failed'))));
  });
  // Use the repository's docker-compose test stack to start Postgres + Redis
  try {
    const composeFile = path.join(__dirname, 'docker', 'docker-compose.test.yml');
    if (!fs.existsSync(composeFile)) {
      throw new Error('docker-compose.test.yml not found');
    }

    // Start services
    // Try to bring up the compose stack. If ports are already bound (e.g. Redis/Postgres
    // already running locally), fall back to using local services.
    try {
      await new Promise((resolve, reject) => {
        const up = spawn('docker', ['compose', '-f', composeFile, 'up', '-d'], { stdio: 'inherit' });
        up.on('close', (code) => (code === 0 ? resolve() : reject(new Error('docker compose up failed'))));
      });
    } catch (e) {
      console.warn('docker compose up failed, checking for existing local services:', e?.message ?? e);
      // fall through and we'll check ports below
    }

    // Wait for Postgres (5432) and Redis (6379)
    const net = require('net');
    const waitForPort = (port, timeoutMs = 60000) =>
      new Promise((resolve, reject) => {
        const start = Date.now();
        (function check() {
          const sock = net.createConnection(port, '127.0.0.1');
          sock.on('connect', () => {
            sock.end();
            resolve();
          });
          sock.on('error', () => {
            if (Date.now() - start > timeoutMs) return reject(new Error(`timeout waiting for port ${port}`));
            setTimeout(check, 1000);
          });
        })();
      });

    // Wait for Postgres (5432) and Redis (6379) to be ready; if docker compose failed
    // but services already running locally, these checks will still succeed.
    await waitForPort(5432).catch(() => {
      throw new Error('Postgres not available on localhost:5432; ensure docker-compose or a local Postgres is running');
    });
    await waitForPort(6379).catch(() => {
      // Redis is optional for some tests; warn but continue
      console.warn('Redis not available on localhost:6379; some integration tests may fail');
    });

    // Load backend/.env.test into env
    const envFile = path.join(backendDir, '.env.test');
    if (fs.existsSync(envFile)) {
      const lines = fs.readFileSync(envFile, 'utf8').split(/\r?\n/);
      for (const l of lines) {
        const m = l.match(/^\s*([A-Za-z0-9_]+)=(.*)$/);
        if (m) {
          const key = m[1];
          let val = m[2];
          // strip surrounding quotes
          if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
            val = val.slice(1, -1);
          }
          process.env[key] = val;
        }
      }
    }

    // Ensure JWT secrets exist for Zod validation
    process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'x'.repeat(40);
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'y'.repeat(40);

    // Run backend migrations so the test database has the required schema.
    // This ensures integration tests don't fail with "relation \"users\" does not exist".
    try {
      console.log('Running backend migrations (npm run migrate)...');
      await new Promise((resolve, reject) => {
        const mig = spawn('npm', ['run', 'migrate'], { cwd: backendDir, stdio: 'inherit', env: { ...process.env } });
        mig.on('close', (code) => (code === 0 ? resolve() : reject(new Error('backend migrate failed'))));
      });
      // Optionally run seeds if available to populate initial data for tests
      const seedScript = path.join(backendDir, 'dist', 'db', 'seed.js');
      const seedSrc = path.join(backendDir, 'src', 'db', 'seed.ts');
      if (fs.existsSync(seedScript) || fs.existsSync(seedSrc)) {
        console.log('Running backend seeds (npm run seed)...');
        await new Promise((resolve, reject) => {
          const seed = spawn('npm', ['run', 'seed'], { cwd: backendDir, stdio: 'inherit', env: { ...process.env } });
          seed.on('close', (code) => (code === 0 ? resolve() : reject(new Error('backend seed failed'))));
        });
      }
    } catch (err) {
      console.error('Error running migrations/seeds:', err?.message ?? err);
      throw err;
    }
    // Start backend dev server similar to scripts/run-integration-local.sh
    const checkPort = (port, host = '127.0.0.1') =>
      new Promise((resolve) => {
        const sock = net.createConnection(port, host);
        sock.on('connect', () => {
          sock.end();
          resolve(true);
        });
        sock.on('error', () => resolve(false));
      });
    let server;
    const portInUse = await checkPort(3000);
    if (portInUse) {
      console.log('Port 3000 appears to be in use; assuming backend already running. Skipping spawn.');
    } else {
      let serverCmd;
      let serverArgs;
      const indexTs = path.join(backendDir, 'src', 'index.ts');
      if (fs.existsSync(indexTs)) {
        serverCmd = 'npx';
        serverArgs = ['tsx', 'watch', 'src/index.ts'];
      } else {
        serverCmd = 'npm';
        serverArgs = ['run', 'dev'];
      }

      const server = spawn(serverCmd, serverArgs, { cwd: backendDir, env: { ...process.env, NODE_ENV: 'test' }, stdio: ['ignore', 'inherit', 'inherit'] });
      // Securely create PID_FILE with restrictive permissions
      try {
        fs.writeFileSync(PID_FILE, String(server.pid), { encoding: 'utf8', flag: 'wx', mode: 0o600 });
      } catch (err) {
        if (err.code === 'EEXIST') {
          // If file exists, overwrite with safe permissions
          fs.writeFileSync(PID_FILE, String(server.pid), { encoding: 'utf8', flag: 'w', mode: 0o600 });
        } else {
          throw err;
        }
      }
    }

    // Mark that we used docker-compose so teardown can bring it down
    try {
      fs.writeFileSync(CONTAINER_FILE, 'compose', { encoding: 'utf8', flag: 'wx', mode: 0o600 });
    } catch (err) {
      if (err.code === 'EEXIST') {
        fs.writeFileSync(CONTAINER_FILE, 'compose', { encoding: 'utf8', flag: 'w', mode: 0o600 });
      } else {
        throw err;
      }
    }

    // Wait for backend health endpoint used by script
    try {
      await waitForHealth(30000, 500);
      console.log('Backend started and healthy');
    } catch (e) {
      console.error('Backend failed to become healthy:', e);
      try { process.kill(server.pid); } catch (err) {}
      throw e;
    }
  } catch (e) {
    console.error('Error starting docker compose or backend:', e?.message ?? e);
    throw e;
  }
};
