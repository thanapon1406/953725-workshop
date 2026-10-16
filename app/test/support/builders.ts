// TEST DATA BUILDERS: a test states only the values it cares about;
// everything else gets a valid, faker-generated default.
// The tests read like the scenario, not like a form full of boilerplate.
import { fakerTH } from '@faker-js/faker';
import { hashPassword } from '../../src/auth/passwords';
import { Role } from '../../src/domain/types';
import { NewCandidate } from '../../src/repositories/candidateRepository';
import { NewParty } from '../../src/repositories/partyRepository';
import { NewUser } from '../../src/repositories/userRepository';
import { aValidNationalId } from './nationalIds';

export const DEFAULT_PASSWORD = 'password123';

// scrypt is slow on purpose — hash the default password once, not once per user.
const DEFAULT_PASSWORD_HASH = hashPassword(DEFAULT_PASSWORD);

export type UserSpec = NewUser & { role: Role };

export class UserBuilder {
  private spec: UserSpec;

  constructor(role: Role) {
    this.spec = {
      nationalId: aValidNationalId(),
      passwordHash: DEFAULT_PASSWORD_HASH,
      firstName: fakerTH.person.firstName(),
      lastName: fakerTH.person.lastName(),
      address: fakerTH.location.streetAddress(),
      districtId: 'CM-1',
      role,
    };
  }

  inDistrict(districtId: string): this {
    this.spec.districtId = districtId;
    return this;
  }

  withNationalId(nationalId: string): this {
    this.spec.nationalId = nationalId;
    return this;
  }

  withPassword(password: string): this {
    this.spec.passwordHash = hashPassword(password);
    return this;
  }

  build(): UserSpec {
    return { ...this.spec };
  }
}

export const aVoter = () => new UserBuilder('VOTER');
export const aCommissioner = () => new UserBuilder('COMMISSIONER');
export const anAdmin = () => new UserBuilder('ADMIN');

export class PartyBuilder {
  private spec: NewParty = {
    name: `พรรค${fakerTH.person.lastName()}`,
    logoUrl: null,
    policy: fakerTH.lorem.sentence(),
  };

  named(name: string): this {
    this.spec.name = name;
    return this;
  }

  build(): NewParty {
    return { ...this.spec };
  }
}

export const aParty = () => new PartyBuilder();

export class CandidateBuilder {
  private spec: Omit<NewCandidate, 'partyId'> & { partyId?: number } = {
    districtId: 'CM-1',
    number: 1,
    firstName: fakerTH.person.firstName(),
    lastName: fakerTH.person.lastName(),
    photoUrl: null,
  };

  inDistrict(districtId: string): this {
    this.spec.districtId = districtId;
    return this;
  }

  forParty(partyId: number): this {
    this.spec.partyId = partyId;
    return this;
  }

  numbered(number: number): this {
    this.spec.number = number;
    return this;
  }

  build(): NewCandidate {
    if (this.spec.partyId === undefined) throw new Error('aCandidate() needs .forParty(partyId)');
    return { ...this.spec, partyId: this.spec.partyId };
  }
}

export const aCandidate = () => new CandidateBuilder();
