import { isValidThaiNationalId } from '../../src/domain/thaiNationalId';

describe('isValidThaiNationalId', () => {
  it('accepts an id whose last digit matches the checksum', () => {
    const id = '1509900000017';

    const valid = isValidThaiNationalId(id);

    expect(valid).toBe(true);
  });

  it('rejects an id with a wrong checksum digit', () => {
    expect(isValidThaiNationalId('1509900000018')).toBe(false);
  });

  it.each(['', '150990000001', '15099000000170', '150990000001x'])('rejects malformed id "%s"', (id) => {
    expect(isValidThaiNationalId(id)).toBe(false);
  });
});
