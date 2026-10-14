import { Pool } from 'pg';
import { createPool } from '../../../src/db';

export function createTestPool(): Pool {
  return createPool(process.env.DATABASE_URL!);
}

/**
 * Wipe everything a test can create. Reference data (districts) and
 * Liquibase's own tables stay — they come from the migrations.
 */
export async function truncateAll(pool: Pool): Promise<void> {
  await pool.query('TRUNCATE votes, candidates, parties, users, election RESTART IDENTITY CASCADE');
}
