import jwt from 'jsonwebtoken';
import { Role } from '../domain/types';

/** Who is calling. */
export interface Principal {
  userId: number;
  role: Role;
  districtId: string;
}

export interface TokenService {
  issue(principal: Principal): string;
  /** Returns null when the token is invalid or expired. */
  verify(token: string): Principal | null;
}

export class JwtTokenService implements TokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresInSeconds = 60 * 60,
  ) {}

  issue(principal: Principal): string {
    return jwt.sign(principal, this.secret, { expiresIn: this.expiresInSeconds });
  }

  verify(token: string): Principal | null {
    try {
      const { userId, role, districtId } = jwt.verify(token, this.secret) as Principal;
      return { userId, role, districtId };
    } catch {
      return null;
    }
  }
}
