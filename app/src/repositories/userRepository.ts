import { Pool } from 'pg';
import { Role, User } from '../domain/types';

export type NewUser = Omit<User, 'id' | 'role'>;

export interface UserRepository {
  findById(id: number): Promise<User | null>;
  findByNationalId(nationalId: string): Promise<User | null>;
  create(user: NewUser): Promise<User>;
  updateRole(id: number, role: Role): Promise<User | null>;
}

const COLUMNS = `id, national_id, password_hash, first_name, last_name, address, district_id, role`;

interface UserRow {
  id: number;
  national_id: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  address: string;
  district_id: string;
  role: Role;
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    nationalId: row.national_id,
    passwordHash: row.password_hash,
    firstName: row.first_name,
    lastName: row.last_name,
    address: row.address,
    districtId: row.district_id,
    role: row.role,
  };
}

export class PgUserRepository implements UserRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: number): Promise<User | null> {
    const { rows } = await this.pool.query<UserRow>(`SELECT ${COLUMNS} FROM users WHERE id = $1`, [id]);
    return rows[0] ? toUser(rows[0]) : null;
  }

  async findByNationalId(nationalId: string): Promise<User | null> {
    const { rows } = await this.pool.query<UserRow>(`SELECT ${COLUMNS} FROM users WHERE national_id = $1`, [
      nationalId,
    ]);
    return rows[0] ? toUser(rows[0]) : null;
  }

  async create(user: NewUser): Promise<User> {
    const { rows } = await this.pool.query<UserRow>(
      `INSERT INTO users (national_id, password_hash, first_name, last_name, address, district_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${COLUMNS}`,
      [user.nationalId, user.passwordHash, user.firstName, user.lastName, user.address, user.districtId],
    );
    return toUser(rows[0]);
  }

  async updateRole(id: number, role: Role): Promise<User | null> {
    const { rows } = await this.pool.query<UserRow>(
      `UPDATE users SET role = $2 WHERE id = $1 RETURNING ${COLUMNS}`,
      [id, role],
    );
    return rows[0] ? toUser(rows[0]) : null;
  }
}
