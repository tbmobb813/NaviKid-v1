// ESLint Flat Config for backend code
module.exports = [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '*.lock',
    ],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: Object.assign(
        {
          ecmaVersion: 2022,
          sourceType: 'module',
          ecmaFeatures: { jsx: false },
        },
        process.env.ESLINT_TYPECHECK === 'true'
          ? { project: require('path').join(__dirname, 'backend', 'tsconfig.json') }
          : {}
      ),
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      prettier: require('eslint-plugin-prettier'),
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
];
