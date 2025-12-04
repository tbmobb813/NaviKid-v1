// ESLint Flat Config for frontend/app code
module.exports = [
  {
    ignores: [
      'android/**',
      'android_backup/**',
      'ios/**',
      'backend/**',
      'dist/**',
      'docs/**',
      'templates/**',
      'docker/**',
      'coverage/**',
      'node_modules/**',
      '.expo/**',
      '.expo-shared/**',
      '.cache/**',
      '.eslintcache',
      'perf-artifacts-*/**',
      'perf-artifacts*/**',
      '**/*.js',
      '**/*.jsx',
      '*.lock',
      '*.log',
      '.git/**',
    ],
  },
  {
    files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'hooks/**/*.{ts,tsx}', 'utils/**/*.{ts,tsx}'],
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
      // Note: 'prettier/prettier' rule disabled due to performance issues (causes ESLint to hang)
      // Use npm run format:check instead to verify code formatting
      'react/jsx-filename-extension': ['warn', { extensions: ['.tsx'] }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      'import/prefer-default-export': 'off',
    },
    settings: {
      react: { version: 'detect' },
    },
  },
];
