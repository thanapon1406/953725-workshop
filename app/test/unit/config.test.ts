import { describe, expect, it } from 'vitest';
import { loadConfig } from '../../src/config';

describe('loadConfig', () => {
  it('falls back to local development defaults when nothing is set', () => {
    const env = {};

    const config = loadConfig(env);

    expect(config).toEqual({
      port: 3000,
      databaseUrl: 'postgres://election:election@localhost:5432/election_dev',
      jwtSecret: 'dev-secret',
    });
  });

  it('reads every setting from the given environment', () => {
    const env = { PORT: '8080', DATABASE_URL: 'postgres://db/prod', JWT_SECRET: 's3cret' };

    const config = loadConfig(env);

    expect(config).toEqual({ port: 8080, databaseUrl: 'postgres://db/prod', jwtSecret: 's3cret' });
  });
});
