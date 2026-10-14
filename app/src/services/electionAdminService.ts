import { Candidate, Party } from '../domain/types';
import { ConflictError, NotFoundError, ValidationError } from '../errors';
import { CandidateRepository } from '../repositories/candidateRepository';
import { DistrictRepository } from '../repositories/districtRepository';
import { PartyRepository } from '../repositories/partyRepository';

export interface PartyInput {
  name: string;
  logoUrl?: string | null;
  policy: string;
}

export interface CandidateInput {
  partyId: number;
  number: number;
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
}

/** What กกต. (the election commission) manages: parties and candidates. */
export class ElectionAdminService {
  constructor(
    private readonly parties: PartyRepository,
    private readonly candidates: CandidateRepository,
    private readonly districts: DistrictRepository,
  ) {}

  async createParty(input: PartyInput): Promise<Party> {
    const name = input.name?.trim();
    if (!name) throw new ValidationError('party name is required');
    if (!input.policy?.trim()) throw new ValidationError('party policy is required');
    if (await this.parties.findByName(name)) throw new ConflictError('party name already exists');

    return this.parties.create({ name, logoUrl: input.logoUrl ?? null, policy: input.policy.trim() });
  }

  async addCandidate(districtId: string, input: CandidateInput): Promise<Candidate> {
    if (!(await this.districts.findById(districtId))) throw new NotFoundError('district not found');
    if (!(await this.parties.findById(input.partyId))) throw new ValidationError('unknown party');
    if (!Number.isInteger(input.number) || input.number < 1) {
      throw new ValidationError('candidate number must be a positive integer');
    }
    if (!input.firstName?.trim() || !input.lastName?.trim()) {
      throw new ValidationError('candidate first name and last name are required');
    }

    const existing = await this.candidates.findByDistrict(districtId);
    if (existing.some((c) => c.number === input.number)) {
      throw new ConflictError('candidate number already used in this district');
    }
    if (existing.some((c) => c.partyId === input.partyId)) {
      throw new ConflictError('party already has a candidate in this district');
    }

    return this.candidates.create({
      districtId,
      partyId: input.partyId,
      number: input.number,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      photoUrl: input.photoUrl ?? null,
    });
  }
}
