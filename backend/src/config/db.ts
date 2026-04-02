import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer | null = null;

export async function connectDB(): Promise<void> {
  try {
    let uri = env.MONGODB_URI;
    if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
      logger.info('Starting local MongoDB Memory Server...');
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
    }

    await mongoose.connect(uri, {
      dbName: env.MONGODB_DB_NAME,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info(`✅ MongoDB connected to ${env.MONGODB_DB_NAME} (URI: ${uri})`);

    if (mongoServer) {
       const { seedDatabase } = await import('../seed');
       await seedDatabase();
    }
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected. Attempting reconnection...');
  });
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}
