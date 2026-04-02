import { Request, Response, NextFunction } from 'express';
import { UserRole, ROLE_HIERARCHY } from '../types';
import { sendError } from '../utils/apiResponse';

/**
 * RBAC middleware — checks that req.user.role >= minimumRole in hierarchy.
 * Must be placed AFTER authenticate() middleware.
 */
export function requireRole(minimumRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
      return;
    }

    const userLevel = ROLE_HIERARCHY[req.user.role];
    const requiredLevel = ROLE_HIERARCHY[minimumRole];

    if (userLevel < requiredLevel) {
      sendError(
        res,
        'FORBIDDEN',
        `Requires ${minimumRole} role or higher`,
        403,
      );
      return;
    }

    next();
  };
}
