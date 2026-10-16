// Lab 02: this file passes, but it is hard to read and tells you little when it fails.
// Refactor it into small Arrange-Act-Assert tests (see labs/02-aaa-unit/README.md).
import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/auth/passwords';
import { loadConfig } from '../../src/config';
import { isValidThaiNationalId } from '../../src/domain/thaiNationalId';

describe('stuff', () => {
  it('works', () => {
    const ids = ['1509900000017', '1509900000018', '150990000001', 'abcdefghijklm', '1100000000016'];
    const results: boolean[] = [];
    for (const id of ids) {
      results.push(isValidThaiNationalId(id));
    }
    expect(results[0]).toBe(true);
    expect(results[1]).toBe(false);
    expect(results[2]).toBe(false);
    expect(results[3]).toBe(false);
    expect(results[4]).toBe(true);

    const h = hashPassword('voter1234');
    expect(h).not.toBe('voter1234');
    const h2 = hashPassword('voter1234');
    if (h === h2) {
      throw new Error('same hash');
    }
    expect(verifyPassword('voter1234', h)).toBe(true);
    expect(verifyPassword('voter12345', h)).toBe(false);
    expect(verifyPassword('voter1234', 'garbage')).toBe(false);

    const c = loadConfig({});
    expect(c.port).toBe(3000);
    const c2 = loadConfig({ PORT: '8080', JWT_SECRET: 's' });
    expect(c2.port).toBe(8080);
    expect(c2.jwtSecret).toBe('s');
    expect(c.databaseUrl).toContain('election_dev');
  });

  it('hash', () => {
    hashPassword('x');
  });
});
