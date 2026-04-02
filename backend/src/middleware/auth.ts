import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { JwtPayload } from '../types';
import { sendError } from '../utils/apiResponse';

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
          return next(err);
        }
        if (!user && !optional) {
          sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
          return;
        }
        if (user) {
          req.user = user;
        }
        next();
      },
    )(req, res, next);
  };
}
