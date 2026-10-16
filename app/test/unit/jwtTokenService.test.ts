// Lab 03 Part C — time is a dependency too. We freeze it with Vitest fake timers
// instead of waiting an hour for a token to expire.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { JwtTokenService } from '../../src/auth/tokenService';
import { PRINCIPAL } from '../support/fixtures';

const SECRET = 'scxNBZhWcDREzHU23Apk';
const ANOTHER_SECRET = 'AGGPceoco8h4x3Zgjd63';

describe('JwtTokenService', () => {
  afterEach(() => {
    vi.useRealTimers(); // never leak frozen time into the next test
  });

  it('verifies a token it issued and returns the same principal', () => {
    const tokens = new JwtTokenService(SECRET);
    const principal = PRINCIPAL();

    const token = tokens.issue(principal);

    expect(tokens.verify(token)).toEqual(principal);
  });

  it('rejects a token signed with another secret', () => {
    const issuer = new JwtTokenService(ANOTHER_SECRET);
    const verifier = new JwtTokenService(SECRET);

    const token = issuer.issue(PRINCIPAL());

    expect(verifier.verify(token)).toBeNull();
  });

  it('rejects a token after it expires', () => {
    vi.useFakeTimers({ now: new Date('2026-10-03T09:00:00+07:00') });
    const tokens = new JwtTokenService(SECRET, 60); // good for 60 seconds

    const token = tokens.issue(PRINCIPAL());

    vi.setSystemTime(new Date('2026-10-03T09:01:01+07:00')); // 61 seconds later

    expect(tokens.verify(token)).toBeNull();
  });
});
