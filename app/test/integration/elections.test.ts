// Lab 04 — component tests: the whole app in-process + real Postgres.
// Build data with builders (test/support/builders.ts), insert it through a helper,
// and truncate before each test. See labs/04-test-data/README.md
describe('election management (component)', () => {
  describe('POST /parties', () => {
    it.todo('lets a commissioner create a party');
    it.todo('forbids a voter (403)');
    it.todo('requires a token (401)');
    it.todo('rejects a duplicate party name (409)');
  });

  describe('POST /districts/:id/candidates', () => {
    it.todo('adds a candidate that then appears in the public results of that district');
  });

  describe('PATCH /admin/users/:id/role', () => {
    it.todo('lets an admin promote a voter to commissioner');
  });

  describe('GET /me/candidates', () => {
    it.todo('shows a voter only the candidates of their own district');
  });
});
