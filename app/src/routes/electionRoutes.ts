import { Router } from 'express';
import { authenticate, requireRole } from '../auth/middleware';
import { TokenService } from '../auth/tokenService';
import { NotFoundError } from '../errors';
import { CandidateRepository } from '../repositories/candidateRepository';
import { DistrictRepository } from '../repositories/districtRepository';
import { PartyRepository } from '../repositories/partyRepository';
import { ElectionAdminService } from '../services/electionAdminService';

interface ElectionRouteDeps {
  admin: ElectionAdminService;
  districts: DistrictRepository;
  parties: PartyRepository;
  candidates: CandidateRepository;
  tokens: TokenService;
}

export function electionRoutes({ admin, districts, parties, candidates, tokens }: ElectionRouteDeps): Router {
  const router = Router();
  const commissionerOnly = [authenticate(tokens), requireRole('COMMISSIONER')];

  router.get('/districts', async (_req, res) => {
    res.json(await districts.findAll());
  });

  router.get('/parties', async (_req, res) => {
    res.json(await parties.findAll());
  });

  router.get('/parties/:id', async (req, res) => {
    const party = await parties.findById(Number(req.params.id));
    if (!party) throw new NotFoundError('party not found');
    res.json({ ...party, candidates: await candidates.findByParty(party.id) });
  });

  router.post('/parties', ...commissionerOnly, async (req, res) => {
    res.status(201).json(await admin.createParty(req.body ?? {}));
  });

  router.post('/districts/:id/candidates', ...commissionerOnly, async (req, res) => {
    res.status(201).json(await admin.addCandidate(req.params.id as string, req.body ?? {}));
  });

  // Public results. Scores stay hidden: nobody can close a district's poll yet.
  router.get('/districts/:id/results', async (req, res) => {
    const district = await districts.findById(req.params.id as string);
    if (!district) throw new NotFoundError('district not found');

    const list = await candidates.findByDistrict(district.id);
    res.json({
      district,
      closed: false,
      candidates: list.map((c) => ({
        number: c.number,
        firstName: c.firstName,
        lastName: c.lastName,
        partyName: c.partyName,
      })),
    });
  });

  return router;
}
