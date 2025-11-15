// Central ESLint config entry for the repository. We only use this file to
// declare 'ignores' for very large generated folders so that ESLint will not
// attempt to scan them when running in the new Flat Config mode. The project
// still uses legacy `.eslintrc.json` files for per-package rules — keep those
// intact.

export default {
  ignores: [
    'dist/',
    'backend/dist/',
    'docs/',
    'templates/',
    'server/data/',
    'coverage/',
    'node_modules/',
    'backend/node_modules/',
    '*.lock'
  ]
};
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettierPlugin from 'eslint-plugin-prettier';

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
