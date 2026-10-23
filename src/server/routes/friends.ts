import { Router, Response } from 'express';
import { SubhuDatabase } from '../db.js';
import { AuthenticatedRequest, requireAuth } from '../auth.js';

const router = Router();
const db = SubhuDatabase.getInstance();

// GET /api/v1/friends
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const viewerId = req.user!.id;
  const friends = db.listFriends(viewerId).map((f) => {
    const { passwordHash: _, salt: __, ...safe } = f;
    return safe;
  });
  const pending = db.listPendingRequests(viewerId);

  res.json({
    friends,
    pendingIncoming: pending.incoming,
    pendingOutgoing: pending.outgoing,
  });
});

// POST /api/v1/friends/request
router.post('/request', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { targetUserId } = req.body;
  if (!targetUserId) {
    res.status(400).json({ error: 'targetUserId is required.' });
    return;
  }

  const result = db.sendFriendRequest(req.user!.id, targetUserId);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.status(201).json({ success: true, friendship: result.friendship, message: 'Friend request sent.' });
});

// POST /api/v1/friends/respond
router.post('/respond', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { friendshipId, accept } = req.body;
  if (!friendshipId || accept === undefined) {
    res.status(400).json({ error: 'friendshipId and accept (boolean) are required.' });
    return;
  }

  const success = db.respondFriendRequest(friendshipId, req.user!.id, Boolean(accept));
  if (!success) {
    res.status(400).json({ error: 'Could not process friend request response.' });
    return;
  }

  res.json({ success: true, message: accept ? 'Friend request accepted!' : 'Friend request declined.' });
});

export default router;
