import { Router, Response } from 'express';
import { SubhuDatabase } from '../db.js';
import { AuthenticatedRequest, requireAuth } from '../auth.js';

const router = Router();
const db = SubhuDatabase.getInstance();

// GET /api/v1/search?q=query
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const query = (req.query.q as string) || '';
  const results = db.search(query, req.user!.id);
  res.json({ results });
});

export default router;
