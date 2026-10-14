import { NextFunction, Request, Response } from 'express';
import { Role } from '../domain/types';
import { ForbiddenError, UnauthorizedError } from '../errors';
import { Principal, TokenService } from './tokenService';

export function authenticate(tokens: TokenService) {
  return (req: Request, res: Response, next: NextFunction) => {
    const [scheme, token] = (req.headers.authorization ?? '').split(' ');
    const principal = scheme === 'Bearer' && token ? tokens.verify(token) : null;
    if (!principal) throw new UnauthorizedError();

    res.locals.principal = principal;
    next();
  };
}

export function requireRole(...roles: Role[]) {
  return (_req: Request, res: Response, next: NextFunction) => {
    const principal = res.locals.principal as Principal | undefined;
    if (!principal) throw new UnauthorizedError();
    if (!roles.includes(principal.role)) throw new ForbiddenError();
    next();
  };
}

export function principalOf(res: Response): Principal {
  return res.locals.principal as Principal;
}
