import { Router, Response } from 'express';
import { SubhuDatabase } from '../db.js';

const router = Router();
const db = SubhuDatabase.getInstance();

// GET /api/v1/system/health
router.get('/health', (_, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Subhu Social API v1',
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  });
});

// GET /api/v1/system/stats
router.get('/stats', (_, res: Response) => {
  const allUsers = db.getAllUsers();
  const feed = db.getFeedPosts('usr_admin');
  const reports = db.getReports();
  const auditLogs = db.getAuditLogs();

  res.json({
    usersCount: allUsers.length,
    activePostsCount: feed.length,
    pendingReportsCount: reports.filter((r) => r.status === 'pending').length,
    auditLogsCount: auditLogs.length,
    nodeVersion: process.version,
    platform: process.platform,
  });
});

// POST /api/v1/system/tests/run
router.post('/tests/run', (_, res: Response) => {
  const suiteResults = db.runAutomatedTests();
  res.json(suiteResults);
});

export default router;
