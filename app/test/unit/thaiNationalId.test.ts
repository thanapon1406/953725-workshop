import { describe, expect, it } from 'vitest';
import { isValidThaiNationalId } from '../../src/domain/thaiNationalId';

describe('isValidThaiNationalId', () => {
  it('accepts an id whose last digit matches the checksum', () => {
    const id = '1509900000017';
    const valid = isValidThaiNationalId(id);
    expect(valid).toBe(true);
  });

  it.each(['1100000000016', '1100000000024'])('accepts another valid id %s', (id) => {
    expect(isValidThaiNationalId(id)).toBe(true);
  });

  it('rejects an id with a wrong checksum digit', () => {
    const id = '1509900000018';
    const valid = isValidThaiNationalId(id);
    expect(valid).toBe(false);
  });

  it.each([
    ['empty string', ''],
    ['12 digits', '150990000001'],
    ['14 digits', '15099000000170'],
    ['one letter', '150990000001x'],
    ['all letters', 'abcdefghijklm'],
    ['dashes', '1-5099-00000-01-7'],
  ])('rejects a malformed id (%s)', (_case, id) => {
    expect(isValidThaiNationalId(id)).toBe(false);
  });
});

