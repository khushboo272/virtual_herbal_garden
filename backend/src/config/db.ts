import mongoose from 'mongoose';
import dns from 'dns';
import { env } from './env';
import { logger } from '../utils/logger';

import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer | null = null;

// Force IPv4 DNS resolution — fixes SRV lookup failures on many Windows networks
dns.setDefaultResultOrder('ipv4first');

export async function connectDB(): Promise<void> {
  let uri = env.MONGODB_URI;
  let usingMemoryServer = false;

  // Step 1: If explicitly local, use in-memory server directly
  if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
    logger.info('Starting local MongoDB Memory Server...');
    mongoServer = await MongoMemoryServer.create();
    uri = mongoServer.getUri();
    usingMemoryServer = true;
  }

  // Step 2: Try connecting to the configured URI (Atlas or local)
  if (!usingMemoryServer) {
    try {
      await mongoose.connect(uri, {
        dbName: env.MONGODB_DB_NAME,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
        family: 4, // Force IPv4 — prevents ECONNREFUSED from IPv6 SRV issues
      });
      logger.info(`✅ MongoDB connected to ${env.MONGODB_DB_NAME} (Atlas)`);
    } catch (atlasError: any) {
      logger.warn(`⚠️ Atlas connection failed (${atlasError.code || atlasError.message}). Falling back to in-memory MongoDB...`);

      // Disconnect any partial connection attempt
      try { await mongoose.disconnect(); } catch {}

      // Step 3: Fall back to MongoMemoryServer
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
      usingMemoryServer = true;

      try {
        await mongoose.connect(uri, {
          dbName: env.MONGODB_DB_NAME,
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });
        logger.info(`✅ MongoDB connected to ${env.MONGODB_DB_NAME} (in-memory fallback)`);
      } catch (fallbackError) {
        logger.error('❌ MongoDB connection failed (both Atlas and in-memory):', fallbackError);
        process.exit(1);
      }
    }
  } else {
    // Connect to the already-configured in-memory URI
    try {
      await mongoose.connect(uri, {
        dbName: env.MONGODB_DB_NAME,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      logger.info(`✅ MongoDB connected to ${env.MONGODB_DB_NAME} (in-memory)`);
    } catch (error) {
      logger.error('❌ MongoDB connection failed:', error);
      process.exit(1);
    }
  }

  // Seed if using in-memory server (data is ephemeral)
  if (usingMemoryServer && mongoServer) {
    try {
      const { seedDatabase } = await import('../seed');
      await seedDatabase();
    } catch (seedErr) {
      logger.warn('⚠️ Seeding skipped or partial:', seedErr);
    }
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
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
  logger.info('MongoDB disconnected');
}
