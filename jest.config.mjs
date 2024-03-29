const ci = !!process.env.CI;

/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{js,ts}'],
  coverageReporters: ci
    ? ['html', 'json', 'text-summary']
    : ['html', 'text-summary'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  reporters: ci ? ['default', 'github-actions'] : ['default'],
  setupFilesAfterEnv: ['jest-extended/all', '<rootDir>/test/setup.ts'],
  modulePathIgnorePatterns: ['dist/', 'coverage/'],
};
