// ESLint Flat Config for the repository. This consolidates parser/plugin
// configuration and provides per-folder overrides (backend gets type-aware
// rules via parserOptions.project).

const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const reactPlugin = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');
const prettierPlugin = require('eslint-plugin-prettier');

module.exports = [
  // Global ignores to avoid scanning large generated folders
  {
    ignores: [
      'dist/**',
      'backend/dist/**',
      'docs/**',
      'templates/**',
      'server/data/**',
      'coverage/**',
      'node_modules/**',
      'backend/node_modules/**',
      '*.lock'
    ],
  },

  // Base configuration for TypeScript/TSX files (frontend and general rules)
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooks,
      prettier: prettierPlugin
    },
    rules: {
      'prettier/prettier': 'error',
      'react/jsx-filename-extension': ['warn', { extensions: ['.tsx'] }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      'import/prefer-default-export': 'off'
    },
    settings: {
      react: { version: 'detect' }
    }
  },

  // Backend-specific override: enable type-aware rules by pointing at backend tsconfig
  {
    files: ['backend/**/*.ts', 'backend/**/*.tsx'],
    languageOptions: {
      parserOptions: {
        // Enables type-aware linting for backend code
        project: './backend/tsconfig.json'
      }
    },
    rules: {
      // you can enable additional backend-specific rules here if desired
    }
  }
];
module.exports = [
  {
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
      parser: require.resolve('@typescript-eslint/parser'),
      // Avoid enabling the TypeScript "project" option by default because
      // creating a TypeScript Program for the entire repo can be very slow
      // and cause ESLint to appear to hang on large workspaces. Enable
      // type-aware linting only when the environment variable
      // ESLINT_TYPECHECK=true is set (for CI or explicit runs).
      parserOptions: Object.assign(
        {
          ecmaVersion: 2020,
          sourceType: 'module',
          ecmaFeatures: { jsx: true },
        },
        process.env.ESLINT_TYPECHECK === 'true' ? { project: './tsconfig.json' } : {}
      ),
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      react: require('eslint-plugin-react'),
      'react-hooks': require('eslint-plugin-react-hooks'),
      prettier: require('eslint-plugin-prettier'),
    },
    rules: {
      'prettier/prettier': 'error',
      'react/jsx-filename-extension': ['warn', { extensions: ['.tsx'] }],
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
    settings: {
      react: { version: 'detect' },
    },
  },
];
