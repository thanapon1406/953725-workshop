import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { Pool } from 'pg';
import { createApp, pgDeps } from '../../src/app';
import { JwtTokenService } from '../../src/auth/tokenService';
import { createTestPool, truncateAll } from './support/database';

describe('POST /auth/register (component test: app + real Postgres)', () => {
  let pool: Pool;
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    pool = createTestPool();
    app = createApp(pgDeps(pool, new JwtTokenService('test-secret')));
  });

  beforeEach(async () => {
    await truncateAll(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('registers a voter who can then log in', async () => {
    const registration = {
      nationalId: '1509900000017',
      password: 'voter1234',
      firstName: 'สมชาย',
      lastName: 'ใจดี',
      address: '239 ถ.ห้วยแก้ว',
      districtId: 'CM-1',
    };

    const registered = await request(app).post('/auth/register').send(registration);
    const login = await request(app)
      .post('/auth/login')
      .send({ nationalId: registration.nationalId, password: registration.password });

    expect(registered.status).toBe(201);
    expect(registered.body).toMatchObject({ nationalId: '1509900000017', role: 'VOTER', districtId: 'CM-1' });
    expect(registered.body).not.toHaveProperty('passwordHash');
    expect(login.status).toBe(200);
    expect(login.body.token).toEqual(expect.any(String));
  });
});
