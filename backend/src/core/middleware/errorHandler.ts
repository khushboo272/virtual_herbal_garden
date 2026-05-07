import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { AppError } from '../utils/apiResponse';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  // Log all errors
  logger.error(`${req.method} ${req.path} — ${err.message}`, {
    stack: err.stack,
    body: req.body,
  });

  // Custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
    return;
  }

  // Mongoose ValidationError → 400
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details,
      },
    });
    return;
  }

  // Mongoose CastError (bad ObjectId) → 404
  if (err instanceof mongoose.Error.CastError) {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Invalid ${err.path}: ${err.value}`,
      },
    });
    return;
  }

  // MongoDB duplicate key (code 11000) → 409
  if (
    err.name === 'MongoServerError' &&
    (err as unknown as { code: number }).code === 11000
  ) {
    const keyValue = (err as unknown as { keyValue: Record<string, unknown> }).keyValue;
    const field = Object.keys(keyValue || {})[0] || 'field';
    res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_KEY',
        message: `A record with this ${field} already exists`,
      },
    });
    return;
  }

  // JWT errors → 401
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: err.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token',
      },
    });
    return;
  }

  // Multer errors
  if (err.name === 'MulterError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'FILE_UPLOAD_ERROR',
        message: err.message,
      },
    });
    return;
  }

  // Default → 500
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}
