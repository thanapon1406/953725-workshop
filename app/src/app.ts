import express, { NextFunction, Request, Response } from 'express';
import { Pool } from 'pg';
import { TokenService } from './auth/tokenService';
import { Clock, systemClock } from './clock';
import { DomainError } from './errors';
import { CandidateRepository, PgCandidateRepository } from './repositories/candidateRepository';
import { DistrictRepository, PgDistrictRepository } from './repositories/districtRepository';
import { PartyRepository, PgPartyRepository } from './repositories/partyRepository';
import { PgUserRepository, UserRepository } from './repositories/userRepository';
import { accountRoutes } from './routes/accountRoutes';
import { electionRoutes } from './routes/electionRoutes';
import voteRoutes from './routes/voteRoutes';
import { AccountService } from './services/accountService';
import { ElectionAdminService } from './services/electionAdminService';

export interface AppDeps {
  tokens: TokenService;
  clock: Clock;
  users: UserRepository;
  districts: DistrictRepository;
  parties: PartyRepository;
  candidates: CandidateRepository;
}

/** Real repositories on a real Pool — tests can override any of them. */
export function pgDeps(pool: Pool, tokens: TokenService, overrides: Partial<AppDeps> = {}): AppDeps {
  return {
    tokens,
    clock: systemClock,
    users: new PgUserRepository(pool),
    districts: new PgDistrictRepository(pool),
    parties: new PgPartyRepository(pool),
    candidates: new PgCandidateRepository(pool),
    ...overrides,
  };
}

export function createApp(deps: AppDeps) {
  const accounts = new AccountService(deps.users, deps.districts, deps.tokens);
  const admin = new ElectionAdminService(deps.parties, deps.candidates, deps.districts);

  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use(accountRoutes(accounts, deps.tokens));
  app.use(electionRoutes({ admin, ...deps }));
  app.use(voteRoutes);

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof DomainError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'internal server error' });
  });

  return app;
}
