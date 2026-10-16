import { describe, expect, it } from 'vitest';
import { toPublicUser } from '../../src/services/accountService';

describe('toPublicUser', () => {
  it('drops the password hash and keeps everything else', () => {
    const user = {
      id: 7,
      nationalId: '1509900000017',
      passwordHash: 'scrypt$salt$hash',
      firstName: 'ฐนพล',
      lastName: 'สารสมุทร',
      address: 'CAMT',
      districtId: 'CM-1',
      role: 'VOTER' as const,
    };

    const expected = { ...user } as Partial<typeof user>;
    delete expected.passwordHash;

    const publicUser = toPublicUser(user);

    expect(publicUser).not.toHaveProperty('passwordHash');
    expect(publicUser).toEqual(expected);
  });
});
