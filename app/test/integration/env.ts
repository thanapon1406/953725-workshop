// Runs before every integration test file (vitest "setupFiles"),
// before any app module reads process.env.
process.env.DATABASE_URL ??= 'postgres://election:election@localhost:5433/election_test';
process.env.JWT_SECRET ??= 'test-secret';
