// Lab 03 — replace each it.todo with a real test. See labs/03-test-doubles/README.md
import { describe, it } from 'vitest';
describe('AccountService', () => {
  describe('register', () => {
    it.todo('registers a voter in an existing district (stub DistrictRepository, dummy TokenService)');
    it.todo('rejects an unknown district');
    it.todo('stores a hash, never the plain-text password (spy on UserRepository.create)');
    it.todo('rejects a national id that is already registered (fake UserRepository)');
    it.todo('does not save anything when the national id is invalid (mock: create not called)');
  });

  describe('login', () => {
    it.todo('issues a token for the user (mock TokenService.issue called with the principal)');
    it.todo('rejects a wrong password without issuing a token');
  });

  describe('changeRole', () => {
    it.todo('refuses to make anyone an ADMIN');
  });
});
