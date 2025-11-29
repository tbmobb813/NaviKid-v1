#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const target = path.join(__dirname, '..', 'node_modules', 'test-exclude', 'index.js');
const backup = target + '.patchbak';

const patchFile = path.join(__dirname, 'patch-content.txt');

function apply() {
  try {
    if (!fs.existsSync(target)) {
      console.log('test-exclude not present in node_modules; skipping patch');
      return;
    }
    if (!fs.existsSync(patchFile)) {
      console.error('patch-content.txt not found; cannot apply patch');
      process.exit(1);
    }
    const patchedContent = fs.readFileSync(patchFile, 'utf8');
    // make a backup if not exists
    if (!fs.existsSync(backup)) {
      fs.copyFileSync(target, backup);
    }
    fs.writeFileSync(target, patchedContent, 'utf8');
    console.log('Applied test-exclude compatibility patch from patch-content.txt');
  } catch (err) {
    console.error('Failed to apply test-exclude patch:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

apply();