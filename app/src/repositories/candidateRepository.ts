import { Pool } from 'pg';
import { Candidate } from '../domain/types';

export type NewCandidate = Omit<Candidate, 'id' | 'partyName'>;

export interface CandidateRepository {
  findByDistrict(districtId: string): Promise<Candidate[]>;
  findByParty(partyId: number): Promise<Candidate[]>;
  create(candidate: NewCandidate): Promise<Candidate>;
}

const SELECT = `
  SELECT c.id, c.district_id AS "districtId", c.party_id AS "partyId", p.name AS "partyName",
         c.number, c.first_name AS "firstName", c.last_name AS "lastName", c.photo_url AS "photoUrl"
  FROM candidates c JOIN parties p ON p.id = c.party_id`;

export class PgCandidateRepository implements CandidateRepository {
  constructor(private readonly pool: Pool) {}

  async findByDistrict(districtId: string): Promise<Candidate[]> {
    const { rows } = await this.pool.query<Candidate>(`${SELECT} WHERE c.district_id = $1 ORDER BY c.number`, [
      districtId,
    ]);
    return rows;
  }

  async findByParty(partyId: number): Promise<Candidate[]> {
    const { rows } = await this.pool.query<Candidate>(
      `${SELECT} WHERE c.party_id = $1 ORDER BY c.district_id, c.number`,
      [partyId],
    );
    return rows;
  }

  async create(candidate: NewCandidate): Promise<Candidate> {
    const { rows } = await this.pool.query<{ id: number }>(
      `INSERT INTO candidates (district_id, party_id, number, first_name, last_name, photo_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        candidate.districtId,
        candidate.partyId,
        candidate.number,
        candidate.firstName,
        candidate.lastName,
        candidate.photoUrl,
      ],
    );
    const created = await this.pool.query<Candidate>(`${SELECT} WHERE c.id = $1`, [rows[0].id]);
    return created.rows[0];
  }
}
