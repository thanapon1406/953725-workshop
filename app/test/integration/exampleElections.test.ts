import request from 'supertest';
import { Pool } from 'pg';
import { createApp, pgDeps } from '../../src/app';
import { JwtTokenService } from '../../src/auth/tokenService';
import { CANDIDATE, COMMISSIONER, PARTY, ADMIN, VOTER } from '../support/builders';
import { authHeaderFor, givenFor } from './support/given';
import { createTestPool, truncateAll } from './support/database';
import { beforeAll, describe, beforeEach, afterAll, it, expect } from 'vitest';

describe('election management (component)', () => {
  let pool: Pool;
  let app: ReturnType<typeof createApp>;
  let tokens: JwtTokenService;
  let given: ReturnType<typeof givenFor>;

  beforeAll(() => {
    pool = createTestPool();
    tokens = new JwtTokenService('test-secret');
    app = createApp(pgDeps(pool, tokens));
    given = givenFor(pool);
  });

  beforeEach(async () => {
    await truncateAll(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('POST /parties', () => {
    it('lets a commissioner create a party', async () => {
      const commissioner = await given.user(COMMISSIONER());

      const response = await request(app)
        .post('/parties')
        .set(authHeaderFor(tokens, commissioner))
        .send({ name: 'พรรคแสงดาว', policy: 'แจกแสงดาวทุกหลังคา' });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({ name: 'พรรคแสงดาว', policy: 'แจกแสงดาวทุกหลังคา' });
    });

    it('forbids a voter (403)', async () => {
      const voter = await given.user(VOTER().inDistrict('CM-2'));

      const response = await request(app)
        .post('/parties')
        .set(authHeaderFor(tokens, voter))
        .send({ name: 'พรรคชาวบ้าน', policy: 'คนชาวบ้านมีสิทธิ์พูด' });

      expect(response.status).toBe(403);
    });

    it('requires a token (401)', async () => {
      const response = await request(app)
        .post('/parties')
        .send({ name: 'พรรคไม่มีตัวตน', policy: 'ไม่บอก' });

      expect(response.status).toBe(401);
    });

    it('rejects a duplicate party name (409)', async () => {
      const commissioner = await given.user(COMMISSIONER());
      await given.party(PARTY().named('พรรคแสงดาว'));

      const response = await request(app)
        .post('/parties')
        .set(authHeaderFor(tokens, commissioner))
        .send({ name: 'พรรคแสงดาว', policy: 'ชื่อเดิม' });

      expect(response.status).toBe(409);
    });
  });

  describe('POST /districts/:id/candidates', () => {
    it('adds a candidate that then appears in the public results of that district', async () => {
      const commissioner = await given.user(COMMISSIONER());
      const party = await given.party();

      const created = await request(app)
        .post('/districts/CM-1/candidates')
        .set(authHeaderFor(tokens, commissioner))
        .send({ partyId: party.id, number: 2, firstName: 'มานะ', lastName: 'รักชาติ' });
      expect(created.status).toBe(201);

      const results = await request(app).get('/districts/CM-1/results');

      expect(results.status).toBe(200);
      expect(results.body.candidates).toEqual([
        expect.objectContaining({ number: 2, firstName: 'มานะ', partyName: party.name }),
      ]);
    });
  });

  describe('PATCH /admin/users/:id/role', () => {
    it('lets an admin promote a voter to commissioner', async () => {
      const admin = await given.user(ADMIN());
      const voter = await given.user(VOTER().inDistrict('CM-2'));

      const response = await request(app)
        .patch(`/admin/users/${voter.id}/role`)
        .set(authHeaderFor(tokens, admin))
        .send({ role: 'COMMISSIONER' });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ id: voter.id, role: 'COMMISSIONER' });
    });
  });

  describe('GET /me/candidates', () => {
    it('shows a voter only the candidates of their own district', async () => {
      const voter = await given.user(VOTER().inDistrict('CM-1'));
      const starParty = await given.party();
      const moonParty = await given.party();
      await given.candidate(CANDIDATE().inDistrict('CM-1').forParty(starParty.id).numbered(1));
      await given.candidate(CANDIDATE().inDistrict('CM-1').forParty(moonParty.id).numbered(2));
      await given.candidate(CANDIDATE().inDistrict('CM-2').forParty(starParty.id).numbered(1));

      const response = await request(app).get('/me/candidates').set(authHeaderFor(tokens, voter));

      expect(response.status).toBe(200);
      expect(response.body.map((c: { number: number }) => c.number)).toEqual([1, 2]);
      expect(response.body.every((c: { selected: boolean }) => c.selected === false)).toBe(true);
    });
  });
});
