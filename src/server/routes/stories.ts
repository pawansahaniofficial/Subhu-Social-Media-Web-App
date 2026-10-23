import { Router, Response } from 'express';
import { SubhuDatabase } from '../db.js';
import { AuthenticatedRequest, requireAuth } from '../auth.js';

const router = Router();
const db = SubhuDatabase.getInstance();

// GET /api/v1/stories
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const stories = db.getActiveStories(req.user!.id);
  res.json({ stories });
});

// POST /api/v1/stories
router.post('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { mediaUrl, caption } = req.body;
  if (!mediaUrl) {
    res.status(400).json({ error: 'mediaUrl is required for stories.' });
    return;
  }

  const story = db.createStory(req.user!.id, mediaUrl, caption);
  res.status(201).json({ story });
});

// POST /api/v1/stories/:id/view
router.post('/:id/view', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const storyId = req.params.id;
  db.markStoryViewed(storyId, req.user!.id);
  res.json({ success: true });
});

export default router;
