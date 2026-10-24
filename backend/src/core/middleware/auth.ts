import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { JwtPayload } from '../../types';
import { sendError, AppError } from '../utils/apiResponse';
import { redis } from '../config/redis';
import User from '../../modules/users/User.model';

// In-memory fallback cache for activity throttling (5 minutes)
const lastActiveMemoryCache = new Map<string, number>();

async function trackUserActivity(userId: string): Promise<void> {
  const now = Date.now();
  const cacheKey = `user:active:${userId}`;

  try {
    const isNew = await redis.set(cacheKey, '1', 'EX', 300, 'NX');
    if (isNew !== 'OK') return;
  } catch {
    const last = lastActiveMemoryCache.get(userId) || 0;
    if (now - last < 300000) return;
    lastActiveMemoryCache.set(userId, now);
  }

  // Background non-blocking update
  User.updateOne({ _id: userId }, { $set: { lastActiveAt: new Date(now) } })
    .exec()
    .catch(() => {});
}

/**
 * Authenticate via JWT Bearer token. Populates req.user with JwtPayload.
 * If optional=true, allows unauthenticated requests to pass through (for public endpoints).
 */
export function authenticate(optional = false) {
  return (req: Request, res: Response, next: NextFunction): void => {
    passport.authenticate(
      'jwt',
      { session: false },
      (err: Error | null, user: JwtPayload | false) => {
        if (err) {
          if (err instanceof AppError) {
            sendError(res, err.code, err.message, err.statusCode);
            return;
          }
          return next(err);
        }
        if (!user && !optional) {
          sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
          return;
        }
        if (user) {
          req.user = user;
          trackUserActivity(user.sub).catch(() => {});
        }
        next();
      },
    )(req, res, next);
  };
}
