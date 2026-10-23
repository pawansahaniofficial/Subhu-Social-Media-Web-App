import { Router, Response } from 'express';
import { SubhuDatabase } from '../db.js';
import { AuthenticatedRequest, requireAuth, requireAdmin } from '../auth.js';

const router = Router();
const db = SubhuDatabase.getInstance();

// POST /api/v1/moderation/report
router.post('/report', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { targetId, targetType, reason, details } = req.body;
  if (!targetId || !targetType || !reason) {
    res.status(400).json({ error: 'targetId, targetType, and reason are required.' });
    return;
  }

  const report = db.createReport({
    reporterId: req.user!.id,
    targetId,
    targetType,
    reason,
    details: details || '',
  });

  res.status(201).json({ report, message: 'Thank you for reporting. Our safety team will review this.' });
});

// GET /api/v1/moderation/reports (Admin only)
router.get('/reports', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const reports = db.getReports();
  res.json({ reports });
});

// POST /api/v1/moderation/resolve (Admin only)
router.post('/resolve', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { reportId, action, notes } = req.body;
  if (!reportId || !action) {
    res.status(400).json({ error: 'reportId and action (action_taken | dismissed) are required.' });
    return;
  }

  const success = db.resolveReport(reportId, req.user!.id, action, notes || '');
  if (!success) {
    res.status(404).json({ error: 'Report not found.' });
    return;
  }

  res.json({ success: true, message: 'Report resolved successfully.' });
});

// GET /api/v1/moderation/audit-logs (Admin only)
router.get('/audit-logs', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const logs = db.getAuditLogs();
  res.json({ logs });
});

export default router;
