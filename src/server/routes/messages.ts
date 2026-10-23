import { Router, Response } from 'express';
import { SubhuDatabase } from '../db.js';
import { AuthenticatedRequest, requireAuth } from '../auth.js';

const router = Router();
const db = SubhuDatabase.getInstance();

// GET /api/v1/messages/conversations
router.get('/conversations', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const conversations = db.getConversations(req.user!.id);
  res.json({ conversations });
});

// GET /api/v1/messages/conversations/:id
router.get('/conversations/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const conversationId = req.params.id;
  const messages = db.getMessages(conversationId, req.user!.id);
  res.json({ messages });
});

// POST /api/v1/messages/conversations
router.post('/conversations', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { recipientId } = req.body;
  if (!recipientId) {
    res.status(400).json({ error: 'recipientId is required.' });
    return;
  }

  const conv = db.getOrCreateDirectConversation(req.user!.id, recipientId);
  res.status(201).json({ conversation: conv });
});

// POST /api/v1/messages/send
router.post('/send', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { conversationId, content, attachments } = req.body;

  if (!conversationId || (!content && (!attachments || attachments.length === 0))) {
    res.status(400).json({ error: 'conversationId and content or attachments are required.' });
    return;
  }

  const message = db.sendMessage(conversationId, req.user!.id, content || '', attachments);
  res.status(201).json({ message });
});

export default router;
