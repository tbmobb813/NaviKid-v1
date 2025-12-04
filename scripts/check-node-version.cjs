#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const pkgPath = path.join(process.cwd(), 'package.json');
let enginesRange = '>=18 <23';
try {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (pkg.engines && pkg.engines.node) enginesRange = pkg.engines.node;
} catch (e) {
  // ignore
}

const v = process.version.replace(/^v/, '');
const major = Number(v.split('.')[0]);
if (isNaN(major) || major < 18) {
  console.error(`\nERROR: Node ${v} does not satisfy required range ${enginesRange}.`);
  console.error('Please install and use Node 18 or higher for this project. Recommended tools: Volta, nvm.');
  process.exit(1);
}

process.exit(0);
