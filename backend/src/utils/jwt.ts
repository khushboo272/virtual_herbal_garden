import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { JwtPayload, UserRole } from '../types';
import { env } from '../config/env';

const privateKey = env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n');
const publicKey = env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n');

export function signAccessToken(payload: { sub: string; email: string; role: UserRole }): string {
  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: env.JWT_ACCESS_EXPIRY as any,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as JwtPayload;
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function signResetToken(userId: string): string {
  return jwt.sign({ sub: userId, purpose: 'password-reset' }, privateKey, {
    algorithm: 'RS256',
    expiresIn: '30m',
  });
}

export function verifyResetToken(token: string): { sub: string; purpose: string } {
  return jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as {
    sub: string;
    purpose: string;
  };
}

export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}
