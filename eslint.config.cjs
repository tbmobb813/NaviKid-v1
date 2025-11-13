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
