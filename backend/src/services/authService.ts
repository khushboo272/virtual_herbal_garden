import { Request } from 'express';
import User, { IUser } from '../models/User';
import RefreshToken from '../models/RefreshToken';
import { UserRole, AuditAction } from '../types';
import { hashPassword, comparePassword } from '../utils/hash';
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  signResetToken,
  verifyResetToken,
  generateOTP,
} from '../utils/jwt';
import { encrypt, decrypt } from '../utils/encryption';
import { createAuditLog } from '../utils/auditLogger';
import { AppError } from '../utils/apiResponse';
import { redis } from '../config/redis';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

const REFRESH_TOKEN_EXPIRY_DAYS = 30;

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  async register(email: string, password: string, displayName: string): Promise<IUser> {
    const existing = await User.findOne({ email });
    if (existing) {
      throw new AppError('Email already registered', 409, 'DUPLICATE_EMAIL');
    }

    const passwordHash = await hashPassword(password);
    const otp = generateOTP();

    const user = await User.create({
      email,
      passwordHash,
      displayName,
      role: UserRole.USER,
    });

    // Store OTP in Redis with 10-min expiry
    await redis.setex(`otp:${email}`, 600, otp);

    // TODO: Send verification email via emailService
    return user;
  }

  async login(
    email: string,
    password: string,
    req: Request,
    totpCode?: string,
  ): Promise<TokenPair & { user: IUser; requires2fa?: boolean }> {
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new AppError('Account is banned', 403, 'ACCOUNT_BANNED');
    }

    if (user.isLocked()) {
      throw new AppError('Account temporarily locked. Try again later.', 429, 'ACCOUNT_LOCKED');
    }

    if (!user.passwordHash) {
      throw new AppError('Please login with Google OAuth', 400, 'OAUTH_ONLY');
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Check 2FA
    if (user.is2faEnabled) {
      if (!totpCode) {
        return {
          accessToken: '',
          refreshToken: '',
          user,
          requires2fa: true,
        };
      }
      if (!user.totpSecret) {
        throw new AppError('2FA not properly configured', 500, 'TWO_FA_ERROR');
      }
      const secret = decrypt(user.totpSecret);
      const isValid = authenticator.verify({ token: totpCode, secret });
      if (!isValid) {
        throw new AppError('Invalid 2FA code', 401, 'INVALID_2FA');
      }
    }

    await user.resetLoginAttempts();
    user.lastLoginAt = new Date();
    await user.save();

    const tokens = await this.generateTokenPair(user, req);

    await createAuditLog({
      req,
      action: AuditAction.LOGIN,
      entityType: 'User',
      entityId: user._id.toString(),
    });

    return { ...tokens, user };
  }

  async refresh(
    refreshTokenValue: string,
    req: Request,
  ): Promise<TokenPair> {
    const tokenHash = hashRefreshToken(refreshTokenValue);
    const storedToken = await RefreshToken.findOne({
      tokenHash,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!storedToken) {
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    // Revoke old token (rotation)
    storedToken.revokedAt = new Date();
    await storedToken.save();

    const user = await User.findById(storedToken.user);
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401, 'USER_INACTIVE');
    }

    return this.generateTokenPair(user, req);
  }

  async logout(_userId: string, refreshTokenValue?: string): Promise<void> {
    if (refreshTokenValue) {
      const tokenHash = hashRefreshToken(refreshTokenValue);
      await RefreshToken.updateOne({ tokenHash }, { revokedAt: new Date() });
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await RefreshToken.updateMany(
      { user: userId, revokedAt: null },
      { revokedAt: new Date() },
    );
  }

  async verifyEmail(email: string, code: string): Promise<void> {
    const storedOtp = await redis.get(`otp:${email}`);
    if (!storedOtp || storedOtp !== code) {
      throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
    }

    await User.updateOne({ email }, { isEmailVerified: true });
    await redis.del(`otp:${email}`);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email });
    if (!user) return; // silent — don't leak whether email exists

    const token = signResetToken(user._id.toString());
    // TODO: Send reset email via emailService
    await redis.setex(`reset:${user._id}`, 1800, token);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const payload = verifyResetToken(token);
    if (payload.purpose !== 'password-reset') {
      throw new AppError('Invalid reset token', 400, 'INVALID_TOKEN');
    }

    const storedToken = await redis.get(`reset:${payload.sub}`);
    if (!storedToken || storedToken !== token) {
      throw new AppError('Reset token expired or already used', 400, 'TOKEN_EXPIRED');
    }

    const passwordHash = await hashPassword(newPassword);
    await User.findByIdAndUpdate(payload.sub, { passwordHash });
    await redis.del(`reset:${payload.sub}`);
  }

  async setup2fa(userId: string): Promise<{ secret: string; qrCodeUrl: string }> {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, 'VirtualHerbalGarden', secret);
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    // Store encrypted secret temporarily
    await redis.setex(`2fa-setup:${userId}`, 600, encrypt(secret));

    return { secret, qrCodeUrl };
  }

  async verify2fa(userId: string, totpCode: string): Promise<void> {
    const encryptedSecret = await redis.get(`2fa-setup:${userId}`);
    if (!encryptedSecret) {
      throw new AppError('2FA setup expired. Please start again.', 400, 'TWO_FA_EXPIRED');
    }

    const secret = decrypt(encryptedSecret);
    const isValid = authenticator.verify({ token: totpCode, secret });
    if (!isValid) {
      throw new AppError('Invalid TOTP code', 400, 'INVALID_2FA');
    }

    // Save encrypted secret to DB and enable 2FA
    await User.findByIdAndUpdate(userId, {
      totpSecret: encrypt(secret),
      is2faEnabled: true,
    });
    await redis.del(`2fa-setup:${userId}`);
  }

  private async generateTokenPair(user: IUser, req: Request): Promise<TokenPair> {
    const accessToken = signAccessToken({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const refreshTokenValue = generateRefreshToken();
    const tokenHash = hashRefreshToken(refreshTokenValue);

    await RefreshToken.create({
      user: user._id,
      tokenHash,
      deviceInfo: {
        ua: req.headers['user-agent'] || 'unknown',
        ip: req.ip || req.socket.remoteAddress || 'unknown',
        device: req.headers['x-device-type'] as string || undefined,
      },
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    });

    return { accessToken, refreshToken: refreshTokenValue };
  }
}

export const authService = new AuthService();
