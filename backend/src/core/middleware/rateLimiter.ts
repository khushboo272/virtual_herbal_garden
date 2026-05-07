import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis';
import { env } from '../config/env';

const isMock = env.REDIS_URL === 'redis://localhost:6379' || env.REDIS_URL.includes('mock');

// Global rate limit: 100 req/min/IP
export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  ...(isMock ? {} : {
    store: new RedisStore({
      // @ts-expect-error - redis client type mismatch between ioredis and rate-limit-redis
      sendCommand: (...args: string[]) => redis.call(...args),
      prefix: 'rl:global:',
    })
  }),
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
});

// Auth rate limit: 5 req/min per IP
export const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  ...(isMock ? {} : {
    store: new RedisStore({
      // @ts-expect-error - redis client type mismatch
      sendCommand: (...args: string[]) => redis.call(...args),
      prefix: 'rl:auth:',
    })
  }),
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT',
      message: 'Too many authentication attempts, please try again later',
    },
  },
});

// AI detection rate limit: 10/hour per user
export const detectionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: env.DETECTION_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.sub || req.ip || 'anonymous',
  ...(isMock ? {} : {
    store: new RedisStore({
      // @ts-expect-error - redis client type mismatch
      sendCommand: (...args: string[]) => redis.call(...args),
      prefix: 'rl:detect:',
    })
  }),
  message: {
    success: false,
    error: {
      code: 'DETECTION_RATE_LIMIT',
      message: 'Detection limit reached. Try again later.',
    },
  },
});
