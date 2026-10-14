import { Router } from 'express';
import { authenticate, requireRole } from '../auth/middleware';
import { TokenService } from '../auth/tokenService';
import { AccountService } from '../services/accountService';

export function accountRoutes(accounts: AccountService, tokens: TokenService): Router {
  const router = Router();

  router.post('/auth/register', async (req, res) => {
    const user = await accounts.register(req.body ?? {});
    res.status(201).json(user);
  });

  router.post('/auth/login', async (req, res) => {
    const { nationalId, password } = req.body ?? {};
    const token = await accounts.login(nationalId, password);
    res.json({ token });
  });

  router.patch('/admin/users/:id/role', authenticate(tokens), requireRole('ADMIN'), async (req, res) => {
    const user = await accounts.changeRole(Number(req.params.id), req.body?.role);
    res.json(user);
  });

  return router;
}
