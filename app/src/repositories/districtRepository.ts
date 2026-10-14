import { Pool } from 'pg';
import { District } from '../domain/types';

export interface DistrictRepository {
  findAll(): Promise<District[]>;
  findById(id: string): Promise<District | null>;
}

export class PgDistrictRepository implements DistrictRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(): Promise<District[]> {
    const { rows } = await this.pool.query<District>(
      `SELECT id, province, number FROM districts ORDER BY province, number`,
    );
    return rows;
  }

  async findById(id: string): Promise<District | null> {
    const { rows } = await this.pool.query<District>(`SELECT id, province, number FROM districts WHERE id = $1`, [
      id,
    ]);
    return rows[0] ?? null;
  }
}
