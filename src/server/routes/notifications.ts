import { Router, Response } from 'express';
import { SubhuDatabase } from '../db.js';
import { AuthenticatedRequest, requireAuth } from '../auth.js';

const router = Router();
const db = SubhuDatabase.getInstance();

// GET /api/v1/notifications
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const notifications = db.getNotifications(req.user!.id);
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  res.json({ notifications, unreadCount });
});

// POST /api/v1/notifications/:id/read
router.post('/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const success = db.markNotificationRead(req.params.id, req.user!.id);
  res.json({ success });
});

// POST /api/v1/notifications/mark-all-read
router.post('/mark-all-read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  db.markAllNotificationsRead(req.user!.id);
  res.json({ success: true, message: 'All notifications marked as read.' });
});

export default router;
