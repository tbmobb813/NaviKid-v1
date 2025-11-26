// Flat-config ESLint file for backend TypeScript linting. This uses the
// "flat config" format so ESLint picks up the TypeScript parser correctly
// when invoked from the backend package.
const path = require('path');

module.exports = [
  // Ignore build artifacts and coverage so linting only considers source files.
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', '*.lock'],
  },
  {
    // When ESLint is invoked from the repo root the base path is the repo
    // root. Use a repo-relative pattern so the config matches files under
    // `backend/src/...` regardless of where the CLI is run from.
    files: ['backend/src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
];
