import http from 'http';
import app from './app';
import { env } from './core/config/env';
import { connectDB } from './core/config/db';
import { initializeSocket } from './core/socket';
import { initializeChangeStreams } from './core/socket/changeStreams';
import { logger } from './core/utils/logger';

// Import workers to start them
import './modules/ai-detection/detection.worker';
import './modules/notifications/email.worker';

async function bootstrap(): Promise<void> {
  // Connect to MongoDB
  await connectDB();

  // Create HTTP server
  const server = http.createServer(app);

  // Initialize Socket.io
  initializeSocket(server);

  // Initialize MongoDB Change Streams (requires replica set)
  try {
    initializeChangeStreams();
  } catch (err) {
    logger.warn('Change Streams not available (requires replica set):', err);
  }

  // Start server
  server.listen(env.PORT, () => {
    logger.info(`🌿 Virtual Herbal Garden API running on port ${env.PORT}`);
    logger.info(`📚 API docs: http://localhost:${env.PORT}/api/docs`);
    logger.info(`🔧 Environment: ${env.NODE_ENV}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      const { disconnectDB } = await import('./core/config/db');
      const { disconnectRedis } = await import('./core/config/redis');
      await disconnectDB();
      await disconnectRedis();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled rejection:', err);
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
