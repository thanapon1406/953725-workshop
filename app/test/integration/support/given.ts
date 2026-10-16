// CREATION METHODS: put builder output into the real database through the
// real repositories, so a test's "Given" is one readable line instead of a pile of SQL.
import { Pool } from 'pg';
import { TokenService } from '../../../src/auth/tokenService';
import { Candidate, Party, User } from '../../../src/domain/types';
import { PgCandidateRepository } from '../../../src/repositories/candidateRepository';
import { PgPartyRepository } from '../../../src/repositories/partyRepository';
import { PgUserRepository } from '../../../src/repositories/userRepository';
import { CandidateBuilder, PartyBuilder, UserBuilder, PARTY, VOTER } from '../../support/builders';

export function givenFor(pool: Pool) {
  const users = new PgUserRepository(pool);
  const parties = new PgPartyRepository(pool);
  const candidates = new PgCandidateRepository(pool);

  return {
    async user(builder: UserBuilder = VOTER()): Promise<User> {
      // The users table has no role column in NewUser — create() always makes a VOTER,
      // so any other role is a second step, like the service would do it.
      const { role, ...newUser } = builder.build();
      const created = await users.create(newUser);
      return role === 'VOTER' ? created : (await users.updateRole(created.id, role))!;
    },

    async party(builder: PartyBuilder = PARTY()): Promise<Party> {
      return parties.create(builder.build());
    },

    async candidate(builder: CandidateBuilder): Promise<Candidate> {
      return candidates.create(builder.build());
    },
  };
}

/** Skip the login round-trip: sign a token with the same TokenService the app uses. */
export function authHeaderFor(tokens: TokenService, user: User): { Authorization: string } {
  const token = tokens.issue({ userId: user.id, role: user.role, districtId: user.districtId });
  return { Authorization: `Bearer ${token}` };
}
