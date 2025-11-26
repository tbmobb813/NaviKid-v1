// Flat-config ESLint file for backend TypeScript linting. This uses the
// "flat config" format so ESLint picks up the TypeScript parser correctly
// when invoked from the backend package.
const path = require('path');

module.exports = [
  {
    files: ['src/**/*.{ts,tsx}'],
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
