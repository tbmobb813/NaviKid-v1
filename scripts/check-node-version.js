#!/usr/bin/env node
const semver = require('semver');
const path = require('path');

const pkg = (() => {
  try {
    return require(path.join(process.cwd(), 'package.json'));
  } catch (e) {
    return {};
  }
})();

const engines = (pkg.engines && pkg.engines.node) || '>=22.0.0 <23.0.0';
const nodeVersion = process.version.replace(/^v/, '');

if (!semver.satisfies(nodeVersion, engines)) {
  console.error(`\nERROR: Node ${nodeVersion} does not satisfy required range ${engines}.`);
  console.error('Please install and use Node 22 for this project. Recommended tools: Volta, nvm.');
  console.error('See .nvmrc or package.json engines for the pinned version.');
  process.exit(1);
}

process.exit(0);
