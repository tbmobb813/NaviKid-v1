#!/usr/bin/env node
const { run } = require('./runner');

// Use a robust glob-friendly eslint invocation. This will be run from repo root.
const cmd = 'npx eslint "backend/src/**/*.{ts,tsx}" --max-warnings=0 -f stylish || npx eslint "src/**/*.{ts,tsx}" --max-warnings=0 -f stylish';
run(cmd, 'lint');
