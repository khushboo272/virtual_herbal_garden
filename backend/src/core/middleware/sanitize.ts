import { Request, Response, NextFunction } from 'express';
import sanitize from 'mongo-sanitize';

/**
 * Sanitize all incoming data to prevent NoSQL injection.
 * Strips $ and . prefixed keys from body, query, and params.
 */
export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  // Allow database query console to receive raw aggregation pipeline operators
  if (req.path?.includes('/database/query') || req.url?.includes('/database/query') || req.originalUrl?.includes('/database/query')) {
    return next();
  }

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query) as typeof req.query;
  }
  if (req.params) {
    req.params = sanitize(req.params) as typeof req.params;
  }
  next();
}
