import { describe, expect, it, vi } from 'vitest';
import { verifyPassword } from '../../src/auth/passwords';
import { TokenService } from '../../src/auth/tokenService';
import { ConflictError, UnauthorizedError, ValidationError } from '../../src/errors';
import { DistrictRepository } from '../../src/repositories/districtRepository';
import { AccountService } from '../../src/services/accountService';
import { InMemoryUserRepository } from '../support/inMemoryRepositories';
import { CM1_DISTRICT, VALID_NATIONAL_ID, USER_TOON } from '../support/fixtures';

const PASSWORD = 'voter1234';

// DUMMY — register() never asks for a token, so these two must never run.
// They throw on purpose: if register() ever starts using tokens, a test will say so.
const dummyTokens: TokenService = {
  issue: () => {
    throw new Error('dummy TokenService should not be used while registering');
  },
  verify: () => {
    throw new Error('dummy TokenService should not be used while registering');
  },
};

// STUB — feeds register() one fact: does district CM-1 exist?
function districtRepository(exists: boolean): DistrictRepository {
  return {
    findAll: vi.fn(),
    findById: vi.fn().mockResolvedValue(exists ? CM1_DISTRICT : null),
  };
}

// MOCK — here we also set an expectation on how the token service gets called.
function mockTokens() {
  return { issue: vi.fn().mockReturnValue('token-123'), verify: vi.fn() };
}

function makeAccounts(options: {
  users?: InMemoryUserRepository;
  districts?: DistrictRepository;
  tokens?: TokenService;
} = {}): AccountService {
  return new AccountService(
    options.users ?? new InMemoryUserRepository(),
    options.districts ?? districtRepository(true),
    options.tokens ?? dummyTokens,
  );
}

// Registers one voter, so the login tests have somebody to log in.
async function anAccountWithOneRegisteredVoter(tokens: TokenService) {
  const users = new InMemoryUserRepository(); // FAKE — a real, if tiny, user store
  const accounts = new AccountService(users, districtRepository(true), tokens);
  const voter = await accounts.register(USER_TOON());
  return { accounts, voter };
}

describe('AccountService', () => {
  describe('register', () => {
    it('registers a voter in an existing district', async () => {
      const accounts = makeAccounts();

      const voter = await accounts.register(USER_TOON());

      expect(voter).toMatchObject({
        nationalId: VALID_NATIONAL_ID,
        districtId: CM1_DISTRICT.id,
        role: 'VOTER',
      });
    });

    it('rejects an unknown district', async () => {
      const accounts = makeAccounts({ districts: districtRepository(false) });

      await expect(accounts.register(USER_TOON())).rejects.toThrow(new ValidationError('unknown district'));
    });

    it('stores a hashed password, never the plain text', async () => {
      const users = new InMemoryUserRepository();
      const saveUser = vi.spyOn(users, 'create'); // SPY — records what register() tried to save
      const accounts = makeAccounts({ users });

      await accounts.register(USER_TOON({ password: PASSWORD }));

      const saved = saveUser.mock.calls[0][0];
      expect(saved.passwordHash).not.toContain(PASSWORD);
      expect(verifyPassword(PASSWORD, saved.passwordHash)).toBe(true);
    });

    it('trims surrounding spaces from the names and address before saving', async () => {
      const users = new InMemoryUserRepository();
      const saveUser = vi.spyOn(users, 'create');
      const accounts = makeAccounts({ users });

      await accounts.register(
        USER_TOON({ firstName: '  ณัฐพนธ์ ', lastName: ' พรหมปัน ', address: ' 239 ถ.ห้วยแก้ว ' }),
      );

      const saved = saveUser.mock.calls[0][0];
      expect(saved.firstName).toBe('ณัฐพนธ์');
      expect(saved.lastName).toBe('พรหมปัน');
      expect(saved.address).toBe('239 ถ.ห้วยแก้ว');
    });

    it('rejects a national id that is already registered', async () => {
      const users = new InMemoryUserRepository(); // FAKE — remembers the first registration
      const accounts = makeAccounts({ users });
      await accounts.register(USER_TOON());

      await expect(accounts.register(USER_TOON({ firstName: 'คนอื่น' }))).rejects.toThrow(ConflictError);
    });

    it('does not save anything when the national id is invalid', async () => {
      const users = new InMemoryUserRepository();
      const saveUser = vi.spyOn(users, 'create');
      const accounts = makeAccounts({ users });

      await expect(accounts.register(USER_TOON({ nationalId: '1509900000018' }))).rejects.toThrow(
        ValidationError,
      );

      expect(saveUser).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('issues a token for the user', async () => {
      const tokens = mockTokens();
      const { accounts, voter } = await anAccountWithOneRegisteredVoter(tokens);

      const token = await accounts.login(VALID_NATIONAL_ID, PASSWORD);

      expect(token).toBe('token-123');
      expect(tokens.issue).toHaveBeenCalledWith({ userId: voter.id, role: 'VOTER', districtId: CM1_DISTRICT.id });
    });

    it('rejects a wrong password without issuing a token', async () => {
      const tokens = mockTokens();
      const { accounts } = await anAccountWithOneRegisteredVoter(tokens);

      await expect(accounts.login(VALID_NATIONAL_ID, 'wrong-password')).rejects.toThrow(UnauthorizedError);

      expect(tokens.issue).not.toHaveBeenCalled();
    });
  });

  describe('changeRole', () => {
    it('refuses to make anyone an ADMIN', async () => {
      const accounts = makeAccounts();

      await expect(accounts.changeRole(1, 'ADMIN')).rejects.toThrow(ValidationError);
    });
  });
});
