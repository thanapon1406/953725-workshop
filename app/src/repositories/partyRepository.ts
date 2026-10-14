import { Pool } from 'pg';
import { Party } from '../domain/types';

export type NewParty = Omit<Party, 'id'>;

export interface PartyRepository {
  findAll(): Promise<Party[]>;
  findById(id: number): Promise<Party | null>;
  findByName(name: string): Promise<Party | null>;
  create(party: NewParty): Promise<Party>;
}

const COLUMNS = `id, name, logo_url AS "logoUrl", policy`;

export class PgPartyRepository implements PartyRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(): Promise<Party[]> {
    const { rows } = await this.pool.query<Party>(`SELECT ${COLUMNS} FROM parties ORDER BY name`);
    return rows;
  }

  async findById(id: number): Promise<Party | null> {
    const { rows } = await this.pool.query<Party>(`SELECT ${COLUMNS} FROM parties WHERE id = $1`, [id]);
    return rows[0] ?? null;
  }

  async findByName(name: string): Promise<Party | null> {
    const { rows } = await this.pool.query<Party>(`SELECT ${COLUMNS} FROM parties WHERE name = $1`, [name]);
    return rows[0] ?? null;
  }

  async create(party: NewParty): Promise<Party> {
    const { rows } = await this.pool.query<Party>(
      `INSERT INTO parties (name, logo_url, policy) VALUES ($1, $2, $3) RETURNING ${COLUMNS}`,
      [party.name, party.logoUrl, party.policy],
    );
    return rows[0];
  }
}
