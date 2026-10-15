// Two projects = two test boundaries, visible right in the config.
//   unit        — no I/O, runs in parallel     (npm run test:unit)
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
      displayName: 'unit',
      testEnvironment: 'node',
      transform: tsJest,
      testMatch: ['<rootDir>/test/unit/**/*.test.ts'],
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      transform: tsJest,
      testMatch: ['<rootDir>/test/integration/**/*.test.ts'],
      setupFiles: ['<rootDir>/test/integration/env.ts'],
    },
  ],
};
