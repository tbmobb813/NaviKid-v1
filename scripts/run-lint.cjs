#!/usr/bin/env node
const { run } = require('./runner.cjs');

// Build a robust eslint command string that prefers a local binary, enables
// caching, and restricts the glob to the likely source folders. This avoids
// npx/network stalls and re-parsing the whole repo on every run.
function buildCommand() {
	let eslintCmd;
		try {
			// prefer local eslint binary when available (fast, deterministic)
			const eslintBin = require.resolve('eslint/bin/eslint.js', { paths: [process.cwd()] });
			eslintCmd = `node ${eslintBin}`;
		} catch (e) {
			// If we don't have a resolvable eslint/bin entry (e.g. deps not installed),
			// try the node_modules/.bin wrapper. Avoid using npx because it's slower.
			const fs = require('fs');
			const { join } = require('path');
			const localBin = join(process.cwd(), 'node_modules', '.bin', 'eslint');
			if (fs.existsSync(localBin)) {
				// run the wrapper with node to avoid shell lookup variability
				eslintCmd = `node ${localBin}`;
			} else {
				// Last resort: attempt to use globally-installed `eslint` in PATH.
				// Provide a helpful error if it's not available at runtime.
				eslintCmd = 'eslint';
				console.warn('[lint] Warning: local eslint not found; falling back to global `eslint` command. Install eslint locally for best results.');
			}
		}

	// use cache and limit extensions; cache location keeps repo root clean
	const commonFlags = `--ext .ts,.tsx --cache --cache-location .eslintcache --max-warnings=0 -f stylish`;

	// prefer backend directory, otherwise fall back to root src
	const backendGlob = '"backend/src/**/*.{ts,tsx}"';
	const rootGlob = '"src/**/*.{ts,tsx}"';

	return `${eslintCmd} ${backendGlob} ${commonFlags} || ${eslintCmd} ${rootGlob} ${commonFlags}`;
}

const cmd = buildCommand();
run(cmd, 'lint');
