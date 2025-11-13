#!/usr/bin/env node
const { run } = require('./runner.cjs');

// Prefer backend tsconfig if present, otherwise run root tsc
const cmd = '[ -f backend/tsconfig.json ] && npx tsc -p backend/tsconfig.json --noEmit || npx tsc --noEmit';
run(cmd, 'typecheck');
