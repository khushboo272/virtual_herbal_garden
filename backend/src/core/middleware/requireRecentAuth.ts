import { Request, Response, NextFunction } from 'express';
import { verifyReauthToken } from '../utils/jwt';
import { sendError } from '../utils/apiResponse';

/**
 * Middleware enforcing step-up re-authentication for sensitive actions.
 * Expects a valid, unexpired reauth JWT in the 'X-Reauth-Token' header,
 * with scope === 'reauth' and bound to the authenticated user's ID.
 */
export function requireRecentAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-reauth-token'] as string | undefined;

  if (!token) {
    sendError(res, 'REAUTH_REQUIRED', 'Step-up re-authentication required for this action', 403);
    return;
  }

  try {
    const payload = verifyReauthToken(token);

    if (payload.scope !== 'reauth') {
      sendError(res, 'REAUTH_INVALID', 'Invalid token scope for re-authentication', 403);
      return;
    }

    if (!req.user || payload.sub !== req.user.sub) {
      sendError(res, 'REAUTH_USER_MISMATCH', 'Re-authentication token does not belong to the current user', 403);
      return;
    }

    next();
  } catch (err: any) {
    sendError(res, 'REAUTH_INVALID', 'Re-authentication token is invalid or expired', 403);
  }
}
