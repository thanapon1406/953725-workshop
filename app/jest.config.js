// The `unit` project moved to Vitest (app/vitest.config.mts) in Lab 02.
// Jest now runs only the integration boundary.
//   integration — real Postgres, runs in band  (npm run test:integration)
//
// ts-jest type-checks every test file (a type error fails the test run).
// It compiles to CommonJS so jest.mock() works without ESM workarounds.
const tsJest = {
  '^.+\\.ts$': ['ts-jest', { tsconfig: { module: 'commonjs', moduleResolution: 'bundler' } }],
};

/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: 'integration',
      testEnvironment: 'node',
      transform: tsJest,
      testMatch: ['<rootDir>/test/integration/**/*.test.ts'],
      setupFiles: ['<rootDir>/test/integration/env.ts'],
    },
  ],
};
