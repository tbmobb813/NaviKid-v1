// ESLint Flat Config for the repository. Consolidated into a single export.
// This config:
// - defines global ignore patterns
// - applies the TypeScript parser for .ts/.tsx files
// - enables a backend override that enables type-aware linting using the
//   backend tsconfig (project: './backend/tsconfig.json').

module.exports = [
  // Global ignores to avoid scanning large generated folders
  {
    ignores: [
      'dist/**',
      'backend/dist/**',
      'docs/**',
      'templates/**',
      'server/data/**',
      'docker/postgres-data/**',
      'docker/**',
      'coverage/**',
      'node_modules/**',
      'backend/node_modules/**',
      'android/**',
      'ios/**',
      '.expo/**',
      '.expo-shared/**',
      '.cache/**',
      '.eslintcache',
      'perf-artifacts-*/**',
      'perf-artifacts*/**',
      '*.log',
      '*.lock',
    ],
  },

  // Base configuration for TypeScript/TSX files (frontend and general rules)
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
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
      // Phase 4.4: Prevent console statements - use logger utility instead
      'no-console': 'error', // No console methods allowed - use logger from @/utils/logger
      '@typescript-eslint/no-explicit-any': 'warn', // Warn on new any types
    },
    settings: {
      react: { version: 'detect' },
    },
  },

  // Backend-specific override: enable type-aware rules by pointing at backend tsconfig
  {
    files: ['backend/**/*.ts', 'backend/**/*.tsx'],
    languageOptions: {
      // reuse the same parser. Enable type-aware linting for backend files
      // only when ESLINT_TYPECHECK=true (so `lint:fast` stays fast).
      parser: require('@typescript-eslint/parser'),
      parserOptions: Object.assign(
        {
          ecmaVersion: 2022,
          sourceType: 'module',
          ecmaFeatures: { jsx: false },
        },
        // Use an absolute path to the backend tsconfig so ESLint works
        // even when invoked from the `backend` working directory (npm --prefix).
        process.env.ESLINT_TYPECHECK === 'true'
          ? { project: require('path').join(__dirname, 'backend', 'tsconfig.json') }
          : {}
      ),
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
    },
    rules: {
      // backend-specific rule overrides can be added here
    },
  },
];
