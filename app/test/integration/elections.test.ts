// Lab 04 — component tests: the whole app in-process + real Postgres.
// Build data with builders (test/support/builders.ts), insert it through a helper,
// and truncate before each test. See labs/04-test-data/README.md
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { Pool } from 'pg';
import { createApp, pgDeps } from '../../src/app';
import { JwtTokenService } from '../../src/auth/tokenService';
import { aCandidate, aCommissioner, aParty, anAdmin, aVoter } from '../support/builders';
import { CM1_DISTRICT, CM2_DISTRICT } from '../support/fixtures';
import { authHeaderFor, givenFor } from './support/given';
import { createTestPool, truncateAll } from './support/database';

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
      const commissioner = await given.user(aCommissioner());

      const response = await request(app)
        .post('/parties')
        .set(authHeaderFor(tokens, commissioner))
        .send({ name: 'พรรคแสงดาว', policy: 'แจกแสงดาวทุกหลังคา' });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({ name: 'พรรคแสงดาว', policy: 'แจกแสงดาวทุกหลังคา' });
    });

    it('forbids a voter (403)', async () => {
      const voter = await given.user(aVoter().inDistrict(CM2_DISTRICT.id));

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
      const commissioner = await given.user(aCommissioner());
      await given.party(aParty().named('พรรคแสงดาว'));

      const response = await request(app)
        .post('/parties')
        .set(authHeaderFor(tokens, commissioner))
        .send({ name: 'พรรคแสงดาว', policy: 'ชื่อเดิม' });

      expect(response.status).toBe(409);
    });
  });

  describe('POST /districts/:id/candidates', () => {
    it('adds a candidate that then appears in the public results of that district', async () => {
      const commissioner = await given.user(aCommissioner());
      const party = await given.party();

      const created = await request(app)
        .post(`/districts/${CM1_DISTRICT.id}/candidates`)
        .set(authHeaderFor(tokens, commissioner))
        .send({ partyId: party.id, number: 2, firstName: 'มานะ', lastName: 'รักชาติ' });
      expect(created.status).toBe(201);

      const results = await request(app).get(`/districts/${CM1_DISTRICT.id}/results`);

      expect(results.status).toBe(200);
      expect(results.body.candidates).toEqual([
        expect.objectContaining({ number: 2, firstName: 'มานะ', partyName: party.name }),
      ]);
    });
  });

  describe('PATCH /admin/users/:id/role', () => {
    it('lets an admin promote a voter to commissioner', async () => {
      const admin = await given.user(anAdmin());
      const voter = await given.user(aVoter().inDistrict(CM2_DISTRICT.id));

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
      const voter = await given.user(aVoter().inDistrict(CM1_DISTRICT.id));
      const starParty = await given.party();
      const moonParty = await given.party();
      await given.candidate(aCandidate().inDistrict(CM1_DISTRICT.id).forParty(starParty.id).numbered(1));
      await given.candidate(aCandidate().inDistrict(CM1_DISTRICT.id).forParty(moonParty.id).numbered(2));
      await given.candidate(aCandidate().inDistrict(CM2_DISTRICT.id).forParty(starParty.id).numbered(1));

      const response = await request(app).get('/me/candidates').set(authHeaderFor(tokens, voter));

      expect(response.status).toBe(200);
      expect(response.body.map((c: { number: number }) => c.number)).toEqual([1, 2]);
      expect(response.body.every((c: { selected: boolean }) => c.selected === false)).toBe(true);
    });
  });
});
