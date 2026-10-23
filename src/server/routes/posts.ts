import { Router, Response } from 'express';
import { SubhuDatabase, PostReaction } from '../db.js';
import { AuthenticatedRequest, requireAuth } from '../auth.js';

const router = Router();
const db = SubhuDatabase.getInstance();

// GET /api/v1/posts
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const viewerId = req.user!.id;
  const filter = (req.query.filter as 'all' | 'friends' | 'saved') || 'all';

  const posts = db.getFeedPosts(viewerId, filter);
  res.json({ posts });
});

// POST /api/v1/posts
router.post('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { content, mediaUrls, audience, feeling, location } = req.body;

  if (!content && (!mediaUrls || mediaUrls.length === 0)) {
    res.status(400).json({ error: 'Post must contain either text content or media.' });
    return;
  }

  const post = db.createPost({
    authorId: req.user!.id,
    content: (content || '').trim(),
    mediaUrls: mediaUrls || [],
    audience: audience || 'public',
    feeling: feeling ? feeling.trim() : undefined,
    location: location ? location.trim() : undefined,
  });

  res.status(201).json({ post, message: 'Post published successfully.' });
});

// DELETE /api/v1/posts/:id
router.delete('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const postId = req.params.id;
  const isAdmin = req.user!.role === 'admin';
  const success = db.deletePost(postId, req.user!.id, isAdmin);

  if (!success) {
    res.status(403).json({ error: 'Unable to delete post. Unauthorized or post not found.' });
    return;
  }

  res.json({ success: true, message: 'Post deleted successfully.' });
});

// POST /api/v1/posts/:id/react
router.post('/:id/react', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const postId = req.params.id;
  const { type } = req.body;
  const validTypes = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];

  if (!validTypes.includes(type)) {
    res.status(400).json({ error: `Invalid reaction type. Must be one of: ${validTypes.join(', ')}` });
    return;
  }

  const result = db.toggleReaction(postId, req.user!.id, type as PostReaction['type']);
  res.json(result);
});

// GET /api/v1/posts/:id/comments
router.get('/:id/comments', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const postId = req.params.id;
  const comments = db.getComments(postId);
  res.json({ comments });
});

// POST /api/v1/posts/:id/comments
router.post('/:id/comments', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const postId = req.params.id;
  const { content, parentId } = req.body;

  if (!content || !content.trim()) {
    res.status(400).json({ error: 'Comment content cannot be empty.' });
    return;
  }

  const comment = db.addComment({
    postId,
    authorId: req.user!.id,
    content: content.trim(),
    parentId: parentId || null,
  });

  res.status(201).json({ comment });
});

// POST /api/v1/posts/:id/save
router.post('/:id/save', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const postId = req.params.id;
  const isSaved = db.toggleSavePost(req.user!.id, postId);
  res.json({ isSaved, message: isSaved ? 'Post saved to your bookmarks.' : 'Post removed from saved.' });
});

export default router;
