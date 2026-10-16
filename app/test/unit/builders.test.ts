import { describe, expect, it } from 'vitest';
import { isValidThaiNationalId } from '../../src/domain/thaiNationalId';
import { verifyPassword } from '../../src/auth/passwords';
import { aCandidate, aParty, aVoter, DEFAULT_PASSWORD } from '../support/builders';
import { CM1_DISTRICT, CM2_DISTRICT, VALID_NATIONAL_ID } from '../support/fixtures';

describe('test data builders', () => {
  it('gives every generated voter a national id with a valid checksum', () => {
    const voter = aVoter().build();

    expect(isValidThaiNationalId(voter.nationalId)).toBe(true);
  });

  it('hashes the default password so login can actually work', () => {
    const voter = aVoter().build();

    expect(voter.passwordHash).not.toContain(DEFAULT_PASSWORD);
    expect(verifyPassword(DEFAULT_PASSWORD, voter.passwordHash)).toBe(true);
  });

  it('keeps only the values a test overrides', () => {
    const voter = aVoter().inDistrict(CM2_DISTRICT.id).withNationalId(VALID_NATIONAL_ID).build();

    expect(voter.districtId).toBe(CM2_DISTRICT.id);
    expect(voter.nationalId).toBe(VALID_NATIONAL_ID);
  });

  it('refuses to build a candidate that is not tied to a party', () => {
    expect(() => aCandidate().inDistrict(CM1_DISTRICT.id).build()).toThrow('needs .forParty');
  });

  it('names every generated party differently (with a seeded faker)', () => {
    const first = aParty().build();
    const second = aParty().build();

    expect(second.name).not.toBe(first.name);
  });
});
