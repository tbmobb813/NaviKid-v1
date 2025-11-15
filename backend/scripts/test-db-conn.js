const path = require('path');
// Load .env from backend folder
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');
const child_process = require('child_process');
const { URL } = require('url');

async function main() {
  const url = process.env.DATABASE_URL;
  console.log('DATABASE_URL present:', !!url);
  if (!url) {
    console.error('No DATABASE_URL found in backend/.env');
    process.exit(2);
  }

  const sslFromUrl = url.includes('sslmode=require');
  console.log('Using ssl (from DATABASE_URL):', sslFromUrl);

  // If the user provided a DB_CA_PATH environment variable, attempt to read it
  // and use it as the CA for SSL verification. This avoids disabling TLS.
  let sslOption;
  if (process.env.DB_CA_PATH) {
    try {
      const fs = require('fs');
      const path = require('path');
      const caFullPath = path.isAbsolute(process.env.DB_CA_PATH)
        ? process.env.DB_CA_PATH
        : path.join(process.cwd(), process.env.DB_CA_PATH);
      const ca = fs.readFileSync(caFullPath).toString();
      console.log('Loaded DB CA from:', caFullPath);
      sslOption = { ca, rejectUnauthorized: true };
    } catch (e) {
      console.error('Failed to read DB_CA_PATH:', process.env.DB_CA_PATH, e && e.stack ? e.stack : e);
      sslOption = sslFromUrl ? { rejectUnauthorized: false } : undefined;
    }
  } else {
    sslOption = sslFromUrl ? { rejectUnauthorized: false } : undefined;
  }

  // Attempt IPv4 fallback: if the hostname resolves to IPv6 only, try to
  // resolve an A record via `getent hosts` and connect to that IPv4 address
  // while preserving TLS servername for verification.
  let poolOptions = {
    connectionString: url,
    ssl: sslOption,
    connectionTimeoutMillis: 10000,
  };

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    try {
      const out = child_process.execSync(`getent hosts ${hostname}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      const m = out.match(/(\d{1,3}(?:\.\d{1,3}){3})/);
      if (m) {
        const ipv4 = m[1];
        poolOptions = {
          host: ipv4,
          port: parsed.port ? Number(parsed.port) : 5432,
          user: parsed.username ? decodeURIComponent(parsed.username) : undefined,
          password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
          database: parsed.pathname ? parsed.pathname.replace(/\//, '') : undefined,
          ssl: sslOption ? { ...sslOption, servername: hostname } : undefined,
          connectionTimeoutMillis: 10000,
        };
        console.log('Using IPv4 fallback host:', ipv4);
      }
    } catch (e) {
      // ignore failure to find IPv4 via getent — continue with connectionString
    }
  } catch (e) {
    // ignore URL parse errors
  }

  const pool = new Pool(poolOptions);

  try {
    console.log('Attempting simple query: SELECT NOW()');
    const res = await pool.query('SELECT NOW() as now');
    console.log('Query successful, server time:', res.rows[0].now);
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Database connection error (full):');
    console.error(err && err.stack ? err.stack : err);
    try {
      await pool.end();
    } catch (e) {
      // ignore
    }
    process.exit(1);
  }
}

main();
