// Voting — written in a hurry before the demo, never refactored.
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db';

const router = Router();

router.get('/me/candidates', async (req, res) => {
  let user: any;
  try {
    user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), process.env.JWT_SECRET || 'dev-secret');
  } catch (e) {
    return res.status(401).json({ error: 'authentication required' });
  }

  const result = await pool.query(
    `SELECT c.id, c.number, c.first_name, c.last_name, p.name AS party_name, v.candidate_id AS my_vote
     FROM candidates c
     JOIN parties p ON p.id = c.party_id
     LEFT JOIN votes v ON v.candidate_id = c.id AND v.voter_id = $2
     WHERE c.district_id = $1
     ORDER BY c.number`,
    [user.districtId, user.userId],
  );
  res.json(
    result.rows.map((r) => ({
      id: r.id,
      number: r.number,
      name: r.first_name + ' ' + r.last_name,
      party: r.party_name,
      selected: r.my_vote != null,
    })),
  );
});

router.put('/me/vote', async (req, res) => {
  let user: any;
  try {
    user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), process.env.JWT_SECRET || 'dev-secret');
  } catch (e) {
    return res.status(401).json({ error: 'authentication required' });
  }
  if (user.role != 'VOTER') {
    return res.status(403).json({ error: 'only voters can vote' });
  }

  const candidateId = req.body && req.body.candidateId;
  if (!candidateId) {
    return res.status(400).json({ error: 'candidateId is required' });
  }

  // election must be open
  const election = await pool.query('SELECT opens_at FROM election WHERE id = 1');
  if (election.rows.length == 0 || new Date() < new Date(election.rows[0].opens_at)) {
    return res.status(409).json({ error: 'election is not open' });
  }

  const cand = await pool.query('SELECT id, district_id FROM candidates WHERE id = $1', [candidateId]);
  if (cand.rows.length == 0) {
    return res.status(404).json({ error: 'candidate not found' });
  }
  if (cand.rows[0].district_id != user.districtId) {
    return res.status(403).json({ error: 'candidate is not in your district' });
  }

  const now = new Date();
  const existing = await pool.query('SELECT candidate_id FROM votes WHERE voter_id = $1', [user.userId]);
  if (existing.rows.length > 0) {
    await pool.query('UPDATE votes SET candidate_id = $2, updated_at = $3 WHERE voter_id = $1', [
      user.userId,
      candidateId,
      now,
    ]);
    console.log(`[vote] voter ${user.userId} changed vote to ${candidateId} at ${now.toISOString()}`);
    return res.json({ candidateId: Number(candidateId), changed: true, votedAt: now });
  }
  await pool.query('INSERT INTO votes (voter_id, candidate_id, updated_at) VALUES ($1, $2, $3)', [
    user.userId,
    candidateId,
    now,
  ]);
  console.log(`[vote] voter ${user.userId} voted for ${candidateId} at ${now.toISOString()}`);
  res.status(201).json({ candidateId: Number(candidateId), changed: false, votedAt: now });
});

export default router;
