import { Request, Response, NextFunction } from 'express';
import FeatureFlag from '../../modules/system/FeatureFlag.model';
import { UserRole, ROLE_HIERARCHY } from '../../types';
import { sendError } from '../utils/apiResponse';

/**
 * Express middleware to enforce runtime feature flags.
 * - Always allows SUPER_ADMIN to bypass disabled flags for administrative testing.
 * - Responds with 403 Forbidden { code: 'FEATURE_DISABLED' } when a feature is disabled.
 * - Validates minimumRole hierarchy if configured on the feature flag.
 * - Honors canary rollout percentages if configured.
 */
export function requireFeatureFlag(flagKey: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Super Admin bypass
      if (req.user && req.user.role === UserRole.SUPER_ADMIN) {
        return next();
      }

      const flag = await FeatureFlag.findOne({ key: flagKey.toLowerCase() }).lean();

      // If flag is explicitly disabled
      if (flag && !flag.isEnabled) {
        sendError(
          res,
          'FEATURE_DISABLED',
          `${flag.name || flagKey} is currently disabled by system administrators.`,
          403,
        );
        return;
      }

      // If flag is enabled, check role requirements if specified
      if (flag && flag.isEnabled && flag.minimumRole) {
        const requiredLevel = ROLE_HIERARCHY[flag.minimumRole as UserRole];
        if (requiredLevel !== undefined && requiredLevel > 0) {
          if (!req.user) {
            sendError(res, 'UNAUTHORIZED', 'Authentication required for this feature', 401);
            return;
          }
          const userLevel = ROLE_HIERARCHY[req.user.role as UserRole] ?? 0;
          if (userLevel < requiredLevel) {
            sendError(
              res,
              'FORBIDDEN',
              `Feature requires ${flag.minimumRole} role or higher`,
              403,
            );
            return;
          }
        }
      }

      // If canary rollout percentage is set (< 100)
      if (
        flag &&
        flag.isEnabled &&
        typeof flag.rolloutPercentage === 'number' &&
        flag.rolloutPercentage < 100
      ) {
        const identifier = req.user?.sub || req.ip || 'anonymous';
        let hash = 0;
        for (let i = 0; i < identifier.length; i++) {
          hash = (hash << 5) - hash + identifier.charCodeAt(i);
          hash |= 0;
        }
        const bucket = Math.abs(hash) % 100;
        if (bucket >= flag.rolloutPercentage) {
          sendError(
            res,
            'FEATURE_DISABLED',
            `${flag.name || flagKey} is currently unavailable for your account (canary rollout in progress).`,
            403,
          );
          return;
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
