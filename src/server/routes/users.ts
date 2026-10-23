import { Router, Response } from 'express';
import { SubhuDatabase } from '../db.js';
import { AuthenticatedRequest, requireAuth } from '../auth.js';

const router = Router();
const db = SubhuDatabase.getInstance();

// GET /api/v1/users/suggestions
router.get('/suggestions', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const viewerId = req.user!.id;
  const friends = db.listFriends(viewerId).map((f) => f.id);
  const pending = db.listPendingRequests(viewerId);
  const pendingIds = [
    ...pending.incoming.map((p) => p.requesterId),
    ...pending.outgoing.map((p) => p.addresseeId),
  ];

  const suggestions = db
    .getAllUsers()
    .filter((u) => u.id !== viewerId && !friends.includes(u.id) && !pendingIds.includes(u.id))
    .slice(0, 5)
    .map((u) => {
      const { passwordHash: _, salt: __, ...safe } = u;
      return safe;
    });

  res.json({ suggestions });
});

// GET /api/v1/users/:username
router.get('/:username', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { username } = req.params;
  const user = db.getUserByUsername(username);

  if (!user) {
    res.status(404).json({ error: 'User profile not found.' });
    return;
  }

  const viewerId = req.user!.id;
  const areFriends = db.areFriends(viewerId, user.id);
  const friendship = db.getFriendship(viewerId, user.id);
  const friendsList = db.listFriends(user.id);

  // Get user's posts visible to viewer
  const allUserPosts = db.getFeedPosts(viewerId).filter((p) => p.authorId === user.id);

  const { passwordHash: _, salt: __, ...safeUser } = user;

  res.json({
    profile: {
      ...safeUser,
      friendsCount: friendsList.length,
      postsCount: allUserPosts.length,
      friendshipStatus: friendship ? friendship.status : 'none',
      isRequester: friendship ? friendship.requesterId === viewerId : false,
      areFriends,
    },
    posts: allUserPosts,
  });
});

// PUT /api/v1/users/me
router.put('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { fullName, bio, location, website, avatar, coverPhoto } = req.body;

  const updated = db.updateUser(req.user!.id, {
    fullName: fullName !== undefined ? fullName.trim() : req.user!.fullName,
    bio: bio !== undefined ? bio.trim() : req.user!.bio,
    location: location !== undefined ? location.trim() : req.user!.location,
    website: website !== undefined ? website.trim() : req.user!.website,
    avatar: avatar || req.user!.avatar,
    coverPhoto: coverPhoto || req.user!.coverPhoto,
  });

  if (!updated) {
    res.status(500).json({ error: 'Failed to update user profile.' });
    return;
  }

  const { passwordHash: _, salt: __, ...safeUser } = updated;
  res.json({ user: safeUser, message: 'Profile updated successfully.' });
});

export default router;
