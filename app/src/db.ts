import { Pool } from 'pg';
import { loadConfig } from './config';

export function createPool(databaseUrl: string): Pool {
  return new Pool({ connectionString: databaseUrl });
}

// Module-level singleton. Only the legacy vote routes use it —
// everything else receives its Pool through createApp().
export const pool = createPool(loadConfig().databaseUrl);
