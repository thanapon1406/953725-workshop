// Lab 03 — use in-memory FAKE repositories (write them in test/support/).
import { describe, it } from 'vitest';
describe('ElectionAdminService.addCandidate', () => {
  it.todo('adds a candidate to a district');
  it.todo('rejects a candidate number already used in the district');
  it.todo('rejects a second candidate from the same party in the district');
  it.todo('allows the same number in a different district');
  it.todo('rejects an unknown party');
});
