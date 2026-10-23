import { Router, Response } from 'express';
import { SubhuDatabase } from '../db.js';
import { AuthenticatedRequest, requireAuth } from '../auth.js';

const router = Router();
const db = SubhuDatabase.getInstance();

// POST /api/v1/auth/register
router.post('/register', (req, res: Response) => {
  const { username, email, password, fullName } = req.body;

  if (!username || !email || !password || !fullName) {
    res.status(400).json({ error: 'All fields (username, email, password, fullName) are required.' });
    return;
  }

  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (cleanUsername.length < 3) {
    res.status(400).json({ error: 'Username must be at least 3 alphanumeric characters.' });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    return;
  }

  if (db.getUserByUsername(cleanUsername)) {
    res.status(409).json({ error: 'Username is already taken. Please choose another.' });
    return;
  }

  if (db.getUserByEmail(email.trim())) {
    res.status(409).json({ error: 'An account with this email address already exists.' });
    return;
  }

  const { hash, salt } = SubhuDatabase.hashPassword(password);
  const user = db.createUser({
    username: cleanUsername,
    email: email.trim().toLowerCase(),
    passwordHash: hash,
    salt,
    fullName: fullName.trim(),
    bio: 'New member of Subhu Social.',
    avatar: '/src/assets/images/avatar_creative_user_1792752821026.jpg',
    coverPhoto: '/src/assets/images/cover_landscape_aurora_1792752820966.jpg',
    isVerified: false,
    role: 'user',
    status: 'active',
    twoFactorEnabled: false,
  });

  const session = db.createSession(user.id, req.ip, req.headers['user-agent']);

  const { passwordHash: _, salt: __, ...safeUser } = user;
  res.status(201).json({
    user: safeUser,
    token: session.token,
    message: 'Account registered successfully.',
  });
});

// POST /api/v1/auth/login
router.post('/login', (req, res: Response) => {
  const { identifier, password } = req.body; // identifier can be username or email

  if (!identifier || !password) {
    res.status(400).json({ error: 'Username/email and password are required.' });
    return;
  }

  const user = db.getUserByUsername(identifier) || db.getUserByEmail(identifier);
  if (!user) {
    res.status(401).json({ error: 'Invalid username/email or password.' });
    return;
  }

  if (user.status === 'suspended') {
    res.status(403).json({ error: 'This account has been suspended for terms violation.' });
    return;
  }

  const valid = SubhuDatabase.verifyPassword(password, user.passwordHash, user.salt);
  if (!valid) {
    res.status(401).json({ error: 'Invalid username/email or password.' });
    return;
  }

  const session = db.createSession(user.id, req.ip, req.headers['user-agent']);
  const { passwordHash: _, salt: __, ...safeUser } = user;

  res.json({
    user: safeUser,
    token: session.token,
    message: 'Welcome back to Subhu!',
  });
});

// GET /api/v1/auth/me
router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { passwordHash: _, salt: __, ...safeUser } = req.user!;
  res.json({ user: safeUser });
});

// POST /api/v1/auth/logout
router.post('/logout', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (req.token) {
    db.revokeSession(req.token);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// POST /api/v1/auth/reset-password
router.post('/reset-password', (req, res: Response) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    res.status(400).json({ error: 'Email and new password are required.' });
    return;
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    // Avoid user enumeration
    res.json({ success: true, message: 'If that email exists, password reset has been processed.' });
    return;
  }

  if (newPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    return;
  }

  const { hash, salt } = SubhuDatabase.hashPassword(newPassword);
  db.updateUser(user.id, { passwordHash: hash, salt });

  res.json({ success: true, message: 'Password has been successfully updated.' });
});

export default router;
