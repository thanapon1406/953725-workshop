import { createApp, pgDeps } from './app';
import { JwtTokenService } from './auth/tokenService';
import { loadConfig } from './config';
import { pool } from './db';

const config = loadConfig();
const app = createApp(pgDeps(pool, new JwtTokenService(config.jwtSecret)));

app.listen(config.port, () => {
  console.log(`election backend listening on http://localhost:${config.port}`);
});
