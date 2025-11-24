// ESLint Flat Config for frontend/app code
module.exports = [
  {
    ignores: [
      'dist/**',
      'docs/**',
      'templates/**',
      'coverage/**',
      'node_modules/**',
      '*.lock',
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
