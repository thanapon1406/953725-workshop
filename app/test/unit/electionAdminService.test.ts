// Lab 03 Part B — real in-memory FAKES instead of scripted vi.fn()s.
import { describe, expect, it } from 'vitest';
import { Party } from '../../src/domain/types';
import { ConflictError, ValidationError } from '../../src/errors';
import { NewParty } from '../../src/repositories/partyRepository';
import { ElectionAdminService } from '../../src/services/electionAdminService';
import { CM1_DISTRICT, CM2_DISTRICT, DISTRICTS, CANDIDATE, PARTY } from '../support/fixtures';
import {
  InMemoryCandidateRepository,
  InMemoryDistrictRepository,
  InMemoryPartyRepository,
} from '../support/inMemoryRepositories';

const GREEN_PARTY = PARTY({ name: 'พรรคเขียว', policy: 'สีเขียวทุกที่' });
const BLUE_PARTY = PARTY({ name: 'พรรคฟ้า', policy: 'ท้องฟ้าชัดเจน' });

// Wires the service with fakes and hands each party back under the key you gave it,
// so a test can write `parties.green.id` instead of guessing the generated id.
async function givenElectionAdmin(namedParties: Record<string, NewParty> = {}) {
  const partyRepo = new InMemoryPartyRepository();
  const parties: Record<string, Party> = {};
  for (const [name, input] of Object.entries(namedParties)) {
    parties[name] = await partyRepo.create(input);
  }

  const candidates = new InMemoryCandidateRepository(partyRepo);
  const districts = new InMemoryDistrictRepository(DISTRICTS);
  const admin = new ElectionAdminService(partyRepo, candidates, districts);

  return { admin, candidates, parties };
}

describe('ElectionAdminService.addCandidate', () => {
  it('adds a candidate to a district', async () => {
    const { admin, candidates, parties } = await givenElectionAdmin({ green: GREEN_PARTY });

    const created = await admin.addCandidate(CM1_DISTRICT.id, CANDIDATE({ partyId: parties.green.id, number: 2 }));

    expect(created).toMatchObject({
      districtId: CM1_DISTRICT.id,
      partyId: parties.green.id,
      number: 2,
      partyName: GREEN_PARTY.name,
    });
    expect(await candidates.findByDistrict(CM1_DISTRICT.id)).toHaveLength(1);
  });

  it('rejects a candidate number already used in the district', async () => {
    const { admin, parties } = await givenElectionAdmin({ green: GREEN_PARTY, blue: BLUE_PARTY });
    await admin.addCandidate(CM1_DISTRICT.id, CANDIDATE({ partyId: parties.green.id, number: 2 }));

    const second = admin.addCandidate(CM1_DISTRICT.id, CANDIDATE({ partyId: parties.blue.id, number: 2 }));

    await expect(second).rejects.toThrow(ConflictError);
  });

  it('rejects a second candidate from the same party in the district', async () => {
    const { admin, parties } = await givenElectionAdmin({ green: GREEN_PARTY });
    await admin.addCandidate(CM1_DISTRICT.id, CANDIDATE({ partyId: parties.green.id, number: 1 }));

    const second = admin.addCandidate(CM1_DISTRICT.id, CANDIDATE({ partyId: parties.green.id, number: 5 }));

    await expect(second).rejects.toThrow(ConflictError);
  });

  it('allows the same number in a different district', async () => {
    const { admin, parties } = await givenElectionAdmin({ green: GREEN_PARTY });
    await admin.addCandidate(CM1_DISTRICT.id, CANDIDATE({ partyId: parties.green.id, number: 1 }));

    const other = admin.addCandidate(CM2_DISTRICT.id, CANDIDATE({ partyId: parties.green.id, number: 1 }));

    await expect(other).resolves.toMatchObject({ districtId: CM2_DISTRICT.id, number: 1 });
  });

  it('rejects an unknown party', async () => {
    const { admin } = await givenElectionAdmin();

    const result = admin.addCandidate(CM1_DISTRICT.id, CANDIDATE({ partyId: 99 }));

    await expect(result).rejects.toThrow(ValidationError);
  });
});
