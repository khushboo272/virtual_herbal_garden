import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

// Use mock natively if standard localhost redis URL is provided but no redis server is running
const isMock = env.REDIS_URL === 'redis://localhost:6379' || env.REDIS_URL.includes('mock');

export const redis = isMock
  ? new (require('ioredis-mock'))() as unknown as Redis
  : new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

redis.on('connect', () => {
  logger.info(`✅ Redis connected ${isMock ? '(mock mode)' : ''}`);
});

redis.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
  logger.info('Redis disconnected');
}
