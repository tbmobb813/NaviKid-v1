#!/usr/bin/env node
/*
 Programmatic ESLint debug helper.
 Usage: node tools/lint-debug.js [file]
 Outputs a concise report: env versions, whether file is ignored, resolved config (parser, parserOptions.project), and lint results.
 */
const fs = require('fs');
const path = require('path');
const { ESLint } = require('eslint');

async function main() {
  const file = process.argv[2] || 'backend/src/index.ts';
  const abs = path.resolve(process.cwd(), file);
  console.log('ESLint debug helper');
  console.log('Working dir:', process.cwd());
  console.log('Target file:', abs);

  try {
    const eslintPkg = require('eslint/package.json');
    console.log('ESLint version:', eslintPkg.version);
  } catch (e) {
    console.log('ESLint not installed or not resolvable from this script.');
  }
  try {
    const tsPkg = require(path.join(process.cwd(), 'node_modules', 'typescript', 'package.json'));
    console.log('TypeScript version (workspace):', tsPkg.version);
  } catch (e) {
    try {
      const tsPkg = require('typescript/package.json');
      console.log('TypeScript version (global):', tsPkg.version);
    } catch (e2) {
      console.log('TypeScript not found');
    }
  }

  const eslint = new ESLint({ cwd: process.cwd(), useEslintrc: true });

  const out = [];
  out.push('--- isPathIgnored ---');
  try {
    const ignored = await eslint.isPathIgnored(abs);
    out.push(`${file} ignored? ${ignored}`);
  } catch (e) {
    out.push('isPathIgnored failed: ' + String(e));
  }

  out.push('\n--- calculated config (trimmed) ---');
  try {
    const cfg = await eslint.calculateConfigForFile(abs);
    // pick relevant fields
    const parser = cfg.languageOptions && cfg.languageOptions.parser;
    const pOptions = cfg.languageOptions && cfg.languageOptions.parserOptions;
    out.push('parser: ' + (parser && (parser.id || parser.name || String(parser))));
    out.push('parserOptions keys: ' + (pOptions ? Object.keys(pOptions).join(', ') : 'none'));
    if (pOptions && pOptions.project) out.push('parserOptions.project: ' + pOptions.project);
    out.push('plugins: ' + (cfg.plugins ? Object.keys(cfg.plugins || {}).join(', ') : 'none'));
    out.push('rules count: ' + (cfg.rules ? Object.keys(cfg.rules).length : 0));
  } catch (e) {
    out.push('calculateConfigForFile failed: ' + String(e));
  }

  out.push('\n--- lint results (first 20 messages) ---');
  try {
    const results = await eslint.lintFiles([abs]);
    if (!results || results.length === 0) {
      out.push('No lint results');
    } else {
      const r = results[0];
      out.push(`file: ${r.filePath}`);
      out.push(`errorCount: ${r.errorCount}, warningCount: ${r.warningCount}`);
      const msgs = (r.messages || []).slice(0, 20).map(m => `${m.line}:${m.column} ${m.ruleId || '<parse>'} ${m.message}`);
      out.push(...msgs);
    }
  } catch (e) {
    out.push('lintFiles failed: ' + String(e));
  }

  const report = out.join('\n');
  console.log(report);

  const logDir = path.join(process.cwd(), 'tools', 'lint-debug-logs');
  try { fs.mkdirSync(logDir, { recursive: true }); } catch (e) {}
  const logFile = path.join(logDir, `${path.basename(file).replace(/[^a-zA-Z0-9]/g,'_')}.${Date.now()}.log`);
  fs.writeFileSync(logFile, report);
  console.log('Wrote debug log to', logFile);
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exitCode = 2;
});
