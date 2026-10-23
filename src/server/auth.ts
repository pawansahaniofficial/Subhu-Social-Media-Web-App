import { Request, Response, NextFunction } from 'express';
import { SubhuDatabase, User } from './db.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
  token?: string;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }

  const token = authHeader.substring(7).trim();
  const db = SubhuDatabase.getInstance();
  const session = db.getSessionByToken(token);

  if (!session) {
    res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
    return;
  }

  const user = db.getUserById(session.userId);
  if (!user || user.status === 'suspended') {
    res.status(403).json({ error: 'Account suspended or inaccessible.' });
    return;
  }

  req.user = user;
  req.token = token;
  next();
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const db = SubhuDatabase.getInstance();
    const session = db.getSessionByToken(token);
    if (session) {
      const user = db.getUserById(session.userId);
      if (user && user.status !== 'suspended') {
        req.user = user;
        req.token = token;
      }
    }
  }
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Administrative privileges required.' });
    return;
  }
  next();
}
