import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/apiResponse';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Validate request data against a Zod schema.
 * Parses the specified target (body/query/params) and replaces it with validated data.
 */
export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[target]);
      // Replace with parsed (and potentially coerced) data
      if (target === 'body') req.body = data;
      else if (target === 'query') req.query = data;
      else req.params = data;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        sendError(res, 'VALIDATION_ERROR', 'Invalid request data', 400, details);
        return;
      }
      next(err);
    }
  };
}
