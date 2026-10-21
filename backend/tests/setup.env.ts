/**
 * Setup fake environment variables BEFORE env.ts is imported.
 * All values are safe dummies — never use real secrets here.
 * Registered in jest.config.js under setupFiles (runs before test framework).
 */

import crypto from 'crypto';

// Generate a temporary RSA key pair so JWT schema passes validation
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test_db';
process.env.MONGODB_DB_NAME = 'herbal_garden_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_PRIVATE_KEY = privateKey;
process.env.JWT_PUBLIC_KEY = publicKey;
process.env.JWT_ACCESS_EXPIRY = '1h';
process.env.JWT_REFRESH_EXPIRY = '30d';
process.env.AWS_S3_BUCKET = 'test-bucket';
process.env.AWS_REGION = 'ap-south-1';
process.env.AWS_ACCESS_KEY_ID = 'AKIAIOSFODNN7EXAMPLE';
process.env.AWS_SECRET_ACCESS_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id.apps.googleusercontent.com';
process.env.GOOGLE_CLIENT_SECRET = 'GOCSPX-test-secret';
process.env.GOOGLE_CALLBACK_URL = 'http://localhost:5000/api/v1/auth/google/callback';
process.env.AI_SERVICE_URL = 'http://localhost:8000';
process.env.AI_MODEL_VERSION = 'v2.3.1';
process.env.ENCRYPTION_KEY = 'a'.repeat(32);
process.env.SMTP_HOST = 'smtp.example.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@example.com';
process.env.SMTP_PASS = 'test-smtp-pass';
process.env.CLIENT_URL = 'http://localhost:3000';
