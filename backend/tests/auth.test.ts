import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import User from '../src/models/User';
import { hashPassword } from '../src/utils/hash';

// Minimal app for testing
const app = express();
app.use(express.json());

// Import setup
import './setup';

describe('Auth API', () => {
  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const user = await User.create({
        email: 'test@example.com',
        passwordHash: await hashPassword('TestPass123!'),
        displayName: 'Test User',
        role: 'USER',
      });

      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe('USER');
      expect(user.isActive).toBe(true);
      expect(user.isEmailVerified).toBe(false);
    });

    it('should not allow duplicate emails', async () => {
      await User.create({
        email: 'dup@example.com',
        passwordHash: await hashPassword('TestPass123!'),
        displayName: 'User One',
        role: 'USER',
      });

      await expect(
        User.create({
          email: 'dup@example.com',
          passwordHash: await hashPassword('TestPass456!'),
          displayName: 'User Two',
          role: 'USER',
        }),
      ).rejects.toThrow();
    });
  });

  describe('User Model Methods', () => {
    it('should hash and compare passwords correctly', async () => {
      const hash = await hashPassword('MySecurePassword1!');
      const { comparePassword } = await import('../src/utils/hash');
      const isMatch = await comparePassword('MySecurePassword1!', hash);
      const isNotMatch = await comparePassword('WrongPassword1!', hash);

      expect(isMatch).toBe(true);
      expect(isNotMatch).toBe(false);
    });

    it('should lock after 5 failed attempts', async () => {
      const user = await User.create({
        email: 'locktest@example.com',
        passwordHash: await hashPassword('TestPass123!'),
        displayName: 'Lock Test',
        role: 'USER',
      });

      for (let i = 0; i < 5; i++) {
        await user.incrementLoginAttempts();
      }

      await user.save();
      const refreshed = await User.findById(user._id);
      expect(refreshed!.loginAttempts).toBe(5);
      expect(refreshed!.lockUntil).toBeDefined();
      expect(refreshed!.isLocked()).toBe(true);
    });

    it('should reset login attempts', async () => {
      const user = await User.create({
        email: 'reset@example.com',
        passwordHash: await hashPassword('TestPass123!'),
        displayName: 'Reset Test',
        role: 'USER',
        loginAttempts: 3,
      });

      await user.resetLoginAttempts();
      expect(user.loginAttempts).toBe(0);
      expect(user.lockUntil).toBeNull();
    });
  });

  describe('JWT Utils', () => {
    it('should generate and verify tokens', async () => {
      // Mock env for testing
      const crypto = await import('crypto');
      const { generateKeyPairSync } = crypto;
      const { publicKey, privateKey } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });

      const jwt = await import('jsonwebtoken');
      const payload = { sub: new mongoose.Types.ObjectId().toString(), email: 'test@test.com', role: 'USER' };
      const token = jwt.default.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: '1h' });
      const decoded = jwt.default.verify(token, publicKey, { algorithms: ['RS256'] }) as Record<string, unknown>;

      expect(decoded.sub).toBe(payload.sub);
      expect(decoded.email).toBe(payload.email);
    });
  });
});
