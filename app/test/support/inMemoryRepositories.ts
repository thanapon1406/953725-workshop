// FAKES: working implementations without I/O, for unit tests.
// They must behave like the Pg versions (same ordering, same "not found" = null).
import { Candidate, District, Party, Role, User } from '../../src/domain/types';
import { CandidateRepository, NewCandidate } from '../../src/repositories/candidateRepository';
import { DistrictRepository } from '../../src/repositories/districtRepository';
import { NewParty, PartyRepository } from '../../src/repositories/partyRepository';
import { NewUser, UserRepository } from '../../src/repositories/userRepository';

/** Shared plumbing for the auto-increment tables (users, parties, candidates). */
class InMemoryTable<T extends { id: number }> {
  private readonly rows: T[] = [];
  private nextId = 1;

  findById(id: number): T | null {
    return this.find((row) => row.id === id);
  }

  find(predicate: (row: T) => boolean): T | null {
    return this.rows.find(predicate) ?? null;
  }

  where(predicate: (row: T) => boolean): T[] {
    return this.rows.filter(predicate);
  }

  all(): T[] {
    return [...this.rows];
  }

  insert(fields: Omit<T, 'id'>): T {
    const row = { ...fields, id: this.nextId++ } as T;
    this.rows.push(row);
    return row;
  }
}

// Districts are seeded with their own string ids, so they get no auto-increment.
export class InMemoryDistrictRepository implements DistrictRepository {
  private readonly districts: District[];

  constructor(districts: District[] = []) {
    this.districts = [...districts];
  }

  async findAll(): Promise<District[]> {
    return [...this.districts].sort((a, b) => a.province.localeCompare(b.province) || a.number - b.number);
  }

  async findById(id: string): Promise<District | null> {
    return this.districts.find((d) => d.id === id) ?? null;
  }
}

export class InMemoryUserRepository implements UserRepository {
  private readonly users = new InMemoryTable<User>();

  async findById(id: number): Promise<User | null> {
    return this.users.findById(id);
  }

  async findByNationalId(nationalId: string): Promise<User | null> {
    return this.users.find((u) => u.nationalId === nationalId);
  }

  async create(user: NewUser): Promise<User> {
    return this.users.insert({ ...user, role: 'VOTER' });
  }

  async updateRole(id: number, role: Role): Promise<User | null> {
    const user = this.users.findById(id);
    if (!user) return null;
    user.role = role;
    return user;
  }
}

export class InMemoryPartyRepository implements PartyRepository {
  private readonly parties = new InMemoryTable<Party>();

  async findAll(): Promise<Party[]> {
    return this.parties.all().sort((a, b) => a.name.localeCompare(b.name));
  }

  async findById(id: number): Promise<Party | null> {
    return this.parties.findById(id);
  }

  async findByName(name: string): Promise<Party | null> {
    return this.parties.find((p) => p.name === name);
  }

  async create(party: NewParty): Promise<Party> {
    return this.parties.insert(party);
  }
}

export class InMemoryCandidateRepository implements CandidateRepository {
  private readonly candidates = new InMemoryTable<Candidate>();

  constructor(private readonly parties: PartyRepository) {}

  async findByDistrict(districtId: string): Promise<Candidate[]> {
    return this.candidates.where((c) => c.districtId === districtId).sort((a, b) => a.number - b.number);
  }

  async findByParty(partyId: number): Promise<Candidate[]> {
    return this.candidates
      .where((c) => c.partyId === partyId)
      .sort((a, b) => a.districtId.localeCompare(b.districtId) || a.number - b.number);
  }

  async create(candidate: NewCandidate): Promise<Candidate> {
    const party = await this.parties.findById(candidate.partyId);
    if (!party) throw new Error(`fake: party ${candidate.partyId} does not exist (foreign key)`);
    return this.candidates.insert({ ...candidate, partyName: party.name });
  }
}
