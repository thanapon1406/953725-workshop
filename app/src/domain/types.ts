export type Role = 'VOTER' | 'COMMISSIONER' | 'ADMIN';

export interface User {
  id: number;
  nationalId: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  address: string;
  districtId: string;
  role: Role;
}

export interface District {
  id: string;
  province: string;
  number: number;
}

export interface Party {
  id: number;
  name: string;
  logoUrl: string | null;
  policy: string;
}

export interface Candidate {
  id: number;
  districtId: string;
  partyId: number;
  partyName: string;
  number: number;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
}
