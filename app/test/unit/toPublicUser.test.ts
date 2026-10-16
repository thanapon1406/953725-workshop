import { describe, expect, it } from 'vitest';
import { toPublicUser } from '../../src/services/accountService';
import { USER_ME } from '../support/fixtures';

describe('toPublicUser', () => {
  it('drops the password hash and keeps everything else', () => {
    const user = USER_ME();
    const expected = { ...user } as Partial<typeof user>;
    delete expected.passwordHash;

    const publicUser = toPublicUser(user);

    expect(publicUser).not.toHaveProperty('passwordHash');
    expect(publicUser).toEqual(expected);
  });
});
