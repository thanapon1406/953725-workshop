import { District, User } from '../../src/domain/types';
import { NewParty } from '../../src/repositories/partyRepository';
import { Registration } from '../../src/services/accountService';
import { CandidateInput } from '../../src/services/electionAdminService';

/** A Thai national id that passes the checksum — used across the account tests. */
export const VALID_NATIONAL_ID = '1509900000017';

/** The district the account tests register voters into. */
export const CM1_DISTRICT: District = { id: 'CM-1', province: 'เชียงใหม่', number: 1 };

/** A second district, for tests that compare two districts (e.g. same number, different district). */
export const CM2_DISTRICT: District = { id: 'CM-2', province: 'เชียงใหม่', number: 2 };

/** Both districts, ready to seed a repository (same objects as above — no copy). */
export const DISTRICTS: District[] = [CM1_DISTRICT, CM2_DISTRICT];

/** A saved user row, exactly as a repository would hand it back. */
export function USER_ME(overrides: Partial<User> = {}): User {
  return {
    id: 7,
    nationalId: VALID_NATIONAL_ID,
    passwordHash: 'scrypt$salt$hash',
    firstName: 'ฐนพล',
    lastName: 'สารสมุทร',
    address: 'CAMT',
    districtId: CM1_DISTRICT.id,
    role: 'VOTER',
    ...overrides,
  };
}

/** What a voter fills in on the register form. */
export function USER_TOON(overrides: Partial<Registration> = {}): Registration {
  return {
    nationalId: VALID_NATIONAL_ID,
    password: 'voter1234',
    firstName: 'ณัฐพนธ์',
    lastName: 'พรหมปัน',
    address: '239 ถ.ห้วยแก้ว',
    districtId: CM1_DISTRICT.id,
    ...overrides,
  };
}

/** A party as the commission submits one (no id yet — the repository assigns it). */
export function PARTY(overrides: Partial<NewParty> = {}): NewParty {
  return { name: 'พรรคทดสอบ', logoUrl: null, policy: 'นโยบายทดสอบ', ...overrides };
}

/** A candidate as the commission submits one (party and number are usually set per test). */
export function CANDIDATE(overrides: Partial<CandidateInput> = {}): CandidateInput {
  return { partyId: 1, number: 1, firstName: 'มานะ', lastName: 'รักชาติ', ...overrides };
}
