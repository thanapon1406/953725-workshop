import { District, User } from '../../src/domain/types';
import { Registration } from '../../src/services/accountService';

/** A Thai national id that passes the checksum — used across the account tests. */
export const VALID_NATIONAL_ID = '1509900000017';

/** The district the account tests register voters into. */
export const CM1_DISTRICT: District = { id: 'CM-1', province: 'เชียงใหม่', number: 1 };

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
