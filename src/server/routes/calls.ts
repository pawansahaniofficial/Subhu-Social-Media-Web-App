import { Router, Response } from 'express';
import { SubhuDatabase } from '../db.js';
import { AuthenticatedRequest, requireAuth } from '../auth.js';

const router = Router();
const db = SubhuDatabase.getInstance();

// POST /api/v1/calls/initiate
router.post('/initiate', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { calleeId, type } = req.body;
  if (!calleeId) {
    res.status(400).json({ error: 'calleeId is required.' });
    return;
  }

  const call = db.createCallSession(req.user!.id, calleeId, type === 'audio' ? 'audio' : 'video');
  const callee = db.getUserById(calleeId);

  res.status(201).json({ call, callee });
});

// POST /api/v1/calls/:id/status
router.post('/:id/status', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body;
  const call = db.updateCallStatus(req.params.id, status);
  if (!call) {
    res.status(404).json({ error: 'Call session not found.' });
    return;
  }
  res.json({ call });
});

export default router;
