import { createRequire } from 'module';

// Use createRequire so the config can load plugins/parsers that may be
// CommonJS-only. This avoids ERR_MODULE_NOT_FOUND when Node tries to ESM-import
// packages that don't expose ESM entry points in certain CI/install setups.
const require = createRequire(import.meta.url);

const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const reactPlugin = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');
const prettierPlugin = require('eslint-plugin-prettier');

export default [
  {
    // files/folders to ignore
    ignores: [
      'node_modules/**',
      'android/**',
      'ios/**',
      '.expo/**',
      '.build/**',
      'dist/**',
  'templates/**',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooks,
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      'react/jsx-filename-extension': ['warn', { extensions: ['.tsx'] }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      'import/prefer-default-export': 'off',
    },
    settings: {
      react: { version: 'detect' },
    },
  },
];
