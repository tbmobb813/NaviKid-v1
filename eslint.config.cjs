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
      'coverage/**',
      'node_modules/**',
      'backend/node_modules/**',
      '*.lock',
    ],
  },

  // Base configuration for TypeScript/TSX files (frontend and general rules)
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: require.resolve('@typescript-eslint/parser'),
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
      'import/prefer-default-export': 'off',
    },
    settings: {
      react: { version: 'detect' },
    },
  },

  // Backend-specific override: enable type-aware rules by pointing at backend tsconfig
  {
    files: ['backend/**/*.ts', 'backend/**/*.tsx'],
    languageOptions: {
      // reuse the same parser, but enable the project option so type-aware
      // rules work for backend files.
      parser: require.resolve('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: false },
        project: './backend/tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
    },
    rules: {
      // backend-specific rule overrides can be added here
    },
  },
];
