import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/auth/passwords';

describe('hashPassword', () => {
  it('never returns the plain-text password', () => {
    const hash = hashPassword('voter1234');

    expect(hash).not.toContain('voter1234');
  });

  it('gives a different hash each time for the same password (random salt)', () => {
    const first = hashPassword('voter1234');

    const second = hashPassword('voter1234');

    expect(second).not.toBe(first);
  });
});

describe('verifyPassword', () => {
  const stored = hashPassword('voter1234');

  it('accepts the password that was hashed', () => {
    expect(verifyPassword('voter1234', stored)).toBe(true);
  });

  it('rejects a different password', () => {
    expect(verifyPassword('voter12345', stored)).toBe(false);
  });

  it.each(['garbage', '', 'bcrypt$abc$def', 'scrypt$onlysalt'])(
    'rejects a malformed stored hash "%s" without throwing',
    (malformed) => {
      expect(verifyPassword('voter1234', malformed)).toBe(false);
    },
  );
});
