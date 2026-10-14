import { hashPassword, verifyPassword } from '../auth/passwords';
import { TokenService } from '../auth/tokenService';
import { isValidThaiNationalId } from '../domain/thaiNationalId';
import { Role, User } from '../domain/types';
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from '../errors';
import { DistrictRepository } from '../repositories/districtRepository';
import { UserRepository } from '../repositories/userRepository';

export interface Registration {
  nationalId: string;
  password: string;
  firstName: string;
  lastName: string;
  address: string;
  districtId: string;
}

export type PublicUser = Omit<User, 'passwordHash'>;

const MIN_PASSWORD_LENGTH = 8;

export function toPublicUser({ passwordHash: _, ...user }: User): PublicUser {
  return user;
}

export class AccountService {
  constructor(
    private readonly users: UserRepository,
    private readonly districts: DistrictRepository,
    private readonly tokens: TokenService,
  ) {}

  async register(registration: Registration): Promise<PublicUser> {
    const { nationalId, password, firstName, lastName, address, districtId } = registration;

    if (!isValidThaiNationalId(nationalId)) throw new ValidationError('invalid national id');
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      throw new ValidationError(`password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }
    if (!firstName?.trim() || !lastName?.trim() || !address?.trim()) {
      throw new ValidationError('first name, last name and address are required');
    }
    if (!(await this.districts.findById(districtId))) throw new ValidationError('unknown district');
    if (await this.users.findByNationalId(nationalId)) throw new ConflictError('national id already registered');

    const user = await this.users.create({
      nationalId,
      passwordHash: hashPassword(password),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      address: address.trim(),
      districtId,
    });
    return toPublicUser(user);
  }

  async login(nationalId: string, password: string): Promise<string> {
    const user = await this.users.findByNationalId(nationalId);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedError('invalid national id or password');
    }
    return this.tokens.issue({ userId: user.id, role: user.role, districtId: user.districtId });
  }

  async changeRole(userId: number, role: Role): Promise<PublicUser> {
    if (role !== 'VOTER' && role !== 'COMMISSIONER') {
      throw new ValidationError('role must be VOTER or COMMISSIONER');
    }
    const user = await this.users.updateRole(userId, role);
    if (!user) throw new NotFoundError('user not found');
    return toPublicUser(user);
  }
}
