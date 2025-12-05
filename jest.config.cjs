module.exports = {
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  // Ignore helper module that lives inside __tests__ but isn't a test file
  testPathIgnorePatterns: ['/node_modules/', '/server/__tests__/', '/__tests__/test-utils\.(ts|tsx|js)$'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@unimodules|unimodules|sentry-expo|native-base|react-clone-referenced-element|@react-native-community|expo-router|@expo/vector-icons|react-native-svg|react-native-reanimated|@react-navigation|lucide-react-native|@react-native-async-storage|@nkzw|react-native-mmkv|expo-crypto|expo-secure-store)/)',
  ],
  testMatch: ['**/__tests__/**/*.(ts|tsx|js)', '**/*.(test|spec).(ts|tsx|js)'],
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'stores/**/*.{ts,tsx}',
    'utils/**/*.{ts,tsx}',
  '!**/*.d.ts',
  '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 23,
      functions: 25,
      lines: 25,
      statements: 25,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  '^react-native$': '<rootDir>/__mocks__/react-native.js',
  '^react-native/jest/mock$': '<rootDir>/__mocks__/react-native-jest-mock.js',
  '^react-native/jest/setup$': '<rootDir>/__mocks__/react-native-jest-setup.js',
    '^expo-constants$': '<rootDir>/__mocks__/expo-constants.js',
    '^expo-crypto$': '<rootDir>/__mocks__/expo-crypto.js',
    '^expo-secure-store$': '<rootDir>/__mocks__/expo-secure-store.js',
    '^lucide-react-native$': '<rootDir>/__mocks__/lucide-react-native.js',
    '^react-native-svg$': '<rootDir>/__mocks__/react-native-svg.js',
    '^@sentry/react-native$': '<rootDir>/__mocks__/@sentry/react-native.js',
    '^react-native-mmkv$': '<rootDir>/__mocks__/react-native-mmkv.js',
    // Prefer TypeScript source when both .ts and .js exist
    '^utils/(.*)$': '<rootDir>/utils/$1.ts',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Explicit transforms instead of relying on the ts-jest preset
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { useESM: false }],
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  setupFiles: ['<rootDir>/jest.setup.cjs'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  // Start backend server before tests and stop after tests so integration suites can run
  globalSetup: '<rootDir>/jest.global-setup.js',
  globalTeardown: '<rootDir>/jest.global-teardown.js',
  testTimeout: 60000,
  // Bail after first failing test file to prevent cascading failures
  bail: 0,
};
