#!/usr/bin/env node
const { run } = require('./runner.cjs');

// Try backend first (if present), otherwise lint root src
const cmd = 'npx eslint "backend/src/**/*.{ts,tsx}" --max-warnings=0 -f stylish || npx eslint "src/**/*.{ts,tsx}" --max-warnings=0 -f stylish';
run(cmd, 'lint');
