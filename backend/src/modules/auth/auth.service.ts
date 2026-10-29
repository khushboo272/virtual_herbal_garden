import { Request } from 'express';
import crypto from 'crypto';
import User, { IUser } from '../users/User.model';
import RefreshToken from './RefreshToken.model';
import { UserRole, AuditAction, ISessionInfo } from '../../types';
import { hashPassword, comparePassword } from '../../core/utils/hash';
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  signResetToken,
  verifyResetToken,
  signReauthToken,
  sign2faChallengeToken,
  verify2faChallengeToken,
  generateOTP,
} from '../../core/utils/jwt';
import { encrypt, decrypt } from '../../core/utils/encryption';
import { createAuditLog } from '../../core/utils/auditLogger';
import { AppError } from '../../core/utils/apiResponse';
import { redis } from '../../core/config/redis';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { parseDeviceLabel, parseDeviceDetails } from '../../core/utils/deviceParser';

const REFRESH_TOKEN_EXPIRY_DAYS = 30;

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

function generate10BackupCodes(): { plainCodes: string[]; hashedCodes: { codeHash: string; used: boolean; usedAt: Date | null }[] } {
  const plainCodes: string[] = [];
  const hashedCodes: { codeHash: string; used: boolean; usedAt: Date | null }[] = [];
  for (let i = 0; i < 10; i++) {
    const code = `${crypto.randomBytes(2).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    plainCodes.push(code);
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    hashedCodes.push({ codeHash, used: false, usedAt: null });
  }
  return { plainCodes, hashedCodes };
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

    return user;
  }

  async login(
    email: string,
    password: string,
    req: Request,
    totpCode?: string,
  ): Promise<TokenPair & { user: IUser; requires2fa?: boolean; challengeToken?: string }> {
    const user = await User.findOne({ email });
    if (!user) {
      await createAuditLog({
        req,
        action: AuditAction.LOGIN_FAILED,
        entityType: 'User',
        details: { email, reason: 'Invalid email or password' },
        severity: 'WARN',
      });
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive || (user.bannedUntil && new Date(user.bannedUntil) > new Date())) {
      throw new AppError('Account is banned', 403, 'ACCOUNT_BANNED');
    }

    if (user.isLocked()) {
      await createAuditLog({
        req,
        action: AuditAction.LOGIN_FAILED,
        entityType: 'User',
        entityId: user._id.toString(),
        details: { email, reason: 'Account locked' },
        severity: 'CRITICAL',
      });
      throw new AppError('Account temporarily locked. Try again later.', 429, 'ACCOUNT_LOCKED');
    }

    if (!user.passwordHash) {
      throw new AppError('Please login with Google OAuth', 400, 'OAUTH_ONLY');
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      await createAuditLog({
        req,
        action: AuditAction.LOGIN_FAILED,
        entityType: 'User',
        entityId: user._id.toString(),
        details: { email, reason: 'Invalid email or password' },
        severity: 'WARN',
      });
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Check 2FA
    if (user.is2faEnabled) {
      if (!totpCode) {
        const challengeToken = sign2faChallengeToken(user._id.toString());
        return {
          accessToken: '',
          refreshToken: '',
          user,
          requires2fa: true,
          challengeToken,
        };
      }

      // Verify provided totpCode or backup code
      let valid = false;
      if (user.totpSecret) {
        const secret = decrypt(user.totpSecret);
        valid = authenticator.verify({ token: totpCode, secret });
      }

      if (!valid && user.twoFactorBackupCodes?.length) {
        const codeHash = crypto.createHash('sha256').update(totpCode.trim()).digest('hex');
        const backup = user.twoFactorBackupCodes.find((c) => !c.used && c.codeHash === codeHash);
        if (backup) {
          backup.used = true;
          backup.usedAt = new Date();
          valid = true;
        }
      }

      if (!valid) {
        await user.incrementLoginAttempts();
        await createAuditLog({
          req,
          action: AuditAction.LOGIN_FAILED,
          entityType: 'User',
          entityId: user._id.toString(),
          details: { email, reason: 'Invalid 2FA code' },
          severity: 'WARN',
        });
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
      severity: 'INFO',
    });

    return { ...tokens, user };
  }

  async loginVerify2fa(
    challengeToken: string,
    code: string,
    req: Request,
  ): Promise<TokenPair & { user: IUser }> {
    let payload: { sub: string; scope: string };
    try {
      payload = verify2faChallengeToken(challengeToken);
    } catch {
      throw new AppError('Invalid or expired 2FA challenge token', 401, 'INVALID_CHALLENGE_TOKEN');
    }

    if (payload.scope !== '2fa_challenge') {
      throw new AppError('Invalid challenge token scope', 401, 'INVALID_CHALLENGE_TOKEN');
    }

    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401, 'UNAUTHORIZED');
    }

    let valid = false;
    if (user.totpSecret) {
      const secret = decrypt(user.totpSecret);
      valid = authenticator.verify({ token: code, secret });
    }

    if (!valid && user.twoFactorBackupCodes?.length) {
      const codeHash = crypto.createHash('sha256').update(code.trim()).digest('hex');
      const backup = user.twoFactorBackupCodes.find((c) => !c.used && c.codeHash === codeHash);
      if (backup) {
        backup.used = true;
        backup.usedAt = new Date();
        valid = true;
      }
    }

    if (!valid) {
      await user.incrementLoginAttempts();
      await createAuditLog({
        req,
        action: AuditAction.LOGIN_FAILED,
        entityType: 'User',
        entityId: user._id.toString(),
        details: { reason: 'Invalid 2FA verification or backup code' },
        severity: 'WARN',
      });
      throw new AppError('Invalid 2FA code or backup code', 401, 'INVALID_2FA');
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
      details: { method: '2fa_challenge' },
      severity: 'INFO',
    });

    return { ...tokens, user };
  }

  async reauth(
    userId: string,
    password?: string,
    totpCode?: string,
    req?: Request,
  ): Promise<{ reauthToken: string }> {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    if (!user.passwordHash && !user.is2faEnabled) {
      throw new AppError(
        'Please set a password or enable 2FA on your account before performing sensitive operations',
        400,
        'NO_REAUTH_CREDENTIALS',
      );
    }

    if (totpCode) {
      if (!user.is2faEnabled || !user.totpSecret) {
        throw new AppError('2FA is not enabled on this account', 400, 'INVALID_2FA');
      }
      const secret = decrypt(user.totpSecret);
      let isValid = authenticator.verify({ token: totpCode, secret });
      if (!isValid && user.twoFactorBackupCodes?.length) {
        const codeHash = crypto.createHash('sha256').update(totpCode.trim()).digest('hex');
        const backup = user.twoFactorBackupCodes.find((c) => !c.used && c.codeHash === codeHash);
        if (backup) {
          backup.used = true;
          backup.usedAt = new Date();
          await user.save();
          isValid = true;
        }
      }

      if (!isValid) {
        await createAuditLog({
          req,
          action: AuditAction.REAUTH_FAILED,
          entityType: 'User',
          entityId: user._id.toString(),
          details: { method: 'totp', reason: 'Invalid code' },
          severity: 'WARN',
        });
        throw new AppError('Invalid 2FA code', 401, 'INVALID_2FA');
      }

      await createAuditLog({
        req,
        action: AuditAction.REAUTH_SUCCESS,
        entityType: 'User',
        entityId: user._id.toString(),
        details: { method: 'totp' },
        severity: 'INFO',
      });
      return { reauthToken: signReauthToken(user._id.toString()) };
    }

    if (password) {
      if (!user.passwordHash) {
        throw new AppError(
          'No password set on this account. Please authenticate with 2FA.',
          400,
          'NO_PASSWORD',
        );
      }
      const isMatch = await comparePassword(password, user.passwordHash);
      if (!isMatch) {
        await createAuditLog({
          req,
          action: AuditAction.REAUTH_FAILED,
          entityType: 'User',
          entityId: user._id.toString(),
          details: { method: 'password', reason: 'Incorrect password' },
          severity: 'WARN',
        });
        throw new AppError('Incorrect password', 401, 'INVALID_CREDENTIALS');
      }

      await createAuditLog({
        req,
        action: AuditAction.REAUTH_SUCCESS,
        entityType: 'User',
        entityId: user._id.toString(),
        details: { method: 'password' },
        severity: 'INFO',
      });
      return { reauthToken: signReauthToken(user._id.toString()) };
    }

    throw new AppError('Please provide password or 2FA code', 400, 'MISSING_CREDENTIALS');
  }

  async get2faStatus(userId: string): Promise<{
    is2faEnabled: boolean;
    hasBackupCodes: boolean;
    remainingBackupCodes: number;
  }> {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    const remaining = (user.twoFactorBackupCodes || []).filter((c) => !c.used).length;
    return {
      is2faEnabled: !!user.is2faEnabled,
      hasBackupCodes: remaining > 0,
      remainingBackupCodes: remaining,
    };
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
    storedToken.lastUsedAt = new Date();
    await storedToken.save();

    const user = await User.findById(storedToken.user);
    if (!user || !user.isActive || (user.bannedUntil && new Date(user.bannedUntil) > new Date())) {
      throw new AppError('Account is banned or inactive', 403, 'ACCOUNT_BANNED');
    }

    return this.generateTokenPair(user, req);
  }

  async logout(_userId: string, refreshTokenValue?: string): Promise<void> {
    if (refreshTokenValue) {
      const tokenHash = hashRefreshToken(refreshTokenValue);
      await RefreshToken.updateOne({ tokenHash }, { revokedAt: new Date() });
    }
  }

  async logoutAll(userId: string, req?: Request): Promise<void> {
    await RefreshToken.updateMany(
      { user: userId, revokedAt: null },
      { revokedAt: new Date() },
    );
    await createAuditLog({
      req,
      action: AuditAction.LOGOUT_ALL,
      entityType: 'User',
      entityId: userId,
      severity: 'INFO',
    });
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
    if (!user) return; // silent

    const token = signResetToken(user._id.toString());
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

  async setup2fa(userId: string): Promise<{ secret: string; otpauthUrl: string; qrCodeUrl: string }> {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, 'VirtualHerbalGarden', secret);
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    // Store encrypted secret temporarily with 10-minute expiry
    await redis.setex(`2fa-setup:${userId}`, 600, encrypt(secret));

    return { secret, otpauthUrl, qrCodeUrl };
  }

  async verify2fa(userId: string, totpCode: string, req?: Request): Promise<{ message: string; backupCodes: string[] }> {
    const encryptedSecret = await redis.get(`2fa-setup:${userId}`);
    if (!encryptedSecret) {
      throw new AppError('2FA setup expired. Please start again.', 400, 'TWO_FA_EXPIRED');
    }

    const secret = decrypt(encryptedSecret);
    const isValid = authenticator.verify({ token: totpCode, secret });
    if (!isValid) {
      throw new AppError('Invalid TOTP code', 400, 'INVALID_2FA');
    }

    const { plainCodes, hashedCodes } = generate10BackupCodes();

    await User.findByIdAndUpdate(userId, {
      totpSecret: encrypt(secret),
      is2faEnabled: true,
      twoFactorBackupCodes: hashedCodes,
    });
    await redis.del(`2fa-setup:${userId}`);

    await createAuditLog({
      req,
      action: AuditAction.TWO_FACTOR_ENABLE,
      entityType: 'User',
      entityId: userId,
      severity: 'INFO',
    });

    return {
      message: '2FA enabled successfully',
      backupCodes: plainCodes,
    };
  }

  async regenerateBackupCodes(userId: string, req?: Request): Promise<{ backupCodes: string[] }> {
    const user = await User.findById(userId);
    if (!user || !user.is2faEnabled) {
      throw new AppError('2FA is not enabled on this account', 400, 'TWO_FA_NOT_ENABLED');
    }

    const { plainCodes, hashedCodes } = generate10BackupCodes();
    user.twoFactorBackupCodes = hashedCodes as any;
    await user.save();

    await createAuditLog({
      req,
      action: AuditAction.TWO_FACTOR_BACKUP_GENERATE,
      entityType: 'User',
      entityId: userId,
      details: { count: 10 },
      severity: 'WARN',
    });

    return { backupCodes: plainCodes };
  }

  async disable2fa(userId: string, code: string, req?: Request): Promise<{ message: string }> {
    const user = await User.findById(userId);
    if (!user || !user.is2faEnabled) {
      throw new AppError('2FA is not enabled on this account', 400, 'TWO_FA_NOT_ENABLED');
    }

    let isValid = false;
    if (user.totpSecret) {
      const secret = decrypt(user.totpSecret);
      isValid = authenticator.verify({ token: code, secret });
    }

    if (!isValid && user.twoFactorBackupCodes?.length) {
      const codeHash = crypto.createHash('sha256').update(code.trim()).digest('hex');
      const backup = user.twoFactorBackupCodes.find((c) => !c.used && c.codeHash === codeHash);
      if (backup) {
        backup.used = true;
        backup.usedAt = new Date();
        isValid = true;
      }
    }

    if (!isValid) {
      throw new AppError('Invalid verification code or backup code', 400, 'INVALID_2FA');
    }

    user.is2faEnabled = false;
    user.totpSecret = null;
    user.twoFactorBackupCodes = [] as any;
    await user.save();

    await createAuditLog({
      req,
      action: AuditAction.TWO_FACTOR_DISABLE,
      entityType: 'User',
      entityId: userId,
      severity: 'WARN',
    });

    return { message: '2FA disabled successfully' };
  }

  // ── Session Management ──

  async getUserSessions(userId: string, currentRefreshToken?: string): Promise<ISessionInfo[]> {
    const tokens = await RefreshToken.find({
      user: userId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    })
      .sort({ lastUsedAt: -1, createdAt: -1 })
      .lean();

    const currentHash = currentRefreshToken ? hashRefreshToken(currentRefreshToken) : null;

    return tokens.map((t) => ({
      id: t._id.toString(),
      ip: t.deviceInfo?.ip || 'unknown',
      userAgent: t.deviceInfo?.ua || 'unknown',
      device: t.deviceInfo?.device || parseDeviceLabel(t.deviceInfo?.ua),
      deviceInfo: parseDeviceDetails(t.deviceInfo?.ua),
      isCurrent: Boolean(currentHash && t.tokenHash === currentHash),
      createdAt: t.createdAt,
      lastUsedAt: t.lastUsedAt || t.createdAt,
    }));
  }

  async revokeSession(userId: string, sessionId: string, req?: Request): Promise<void> {
    const token = await RefreshToken.findOne({ _id: sessionId, user: userId });
    if (!token) {
      throw new AppError('Session not found', 404, 'NOT_FOUND');
    }

    token.revokedAt = new Date();
    await token.save();

    await createAuditLog({
      req,
      action: AuditAction.SESSION_REVOKE,
      entityType: 'Session',
      entityId: sessionId,
      details: { targetUserId: userId },
      severity: 'INFO',
    });
  }

  async revokeOtherSessions(userId: string, currentRefreshToken?: string, req?: Request): Promise<void> {
    const query: Record<string, unknown> = {
      user: userId,
      revokedAt: null,
    };

    if (currentRefreshToken) {
      const currentHash = hashRefreshToken(currentRefreshToken);
      query.tokenHash = { $ne: currentHash };
    }

    await RefreshToken.updateMany(query, { $set: { revokedAt: new Date() } });

    await createAuditLog({
      req,
      action: AuditAction.SESSION_REVOKE,
      entityType: 'Session',
      entityId: userId,
      details: { scope: 'revoke_others' },
      severity: 'INFO',
    });
  }

  async generateTokenPair(user: IUser, req: Request): Promise<TokenPair> {
    const accessToken = signAccessToken({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const refreshTokenValue = generateRefreshToken();
    const tokenHash = hashRefreshToken(refreshTokenValue);
    const ua = (req.headers['user-agent'] as string) || 'unknown';
    const ip = (req.ip || req.socket?.remoteAddress || 'unknown') as string;
    const deviceLabel = parseDeviceLabel(ua);

    await RefreshToken.create({
      user: user._id,
      tokenHash,
      deviceInfo: {
        ua,
        ip,
        device: deviceLabel,
      },
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    });

    return { accessToken, refreshToken: refreshTokenValue };
  }

  async generateTokenPairForOAuth(user: IUser, req: Request): Promise<TokenPair> {
    return this.generateTokenPair(user, req);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    req?: Request,
  ): Promise<void> {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    if (!user.passwordHash) {
      throw new AppError(
        'This account was created via Google OAuth. Passwords cannot be set or changed for Google accounts.',
        400,
        'OAUTH_ONLY',
      );
    }

    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 400, 'INCORRECT_PASSWORD');
    }

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    await createAuditLog({
      req,
      action: AuditAction.UPDATE,
      entityType: 'User',
      entityId: user._id.toString(),
      details: { action: 'password_change' },
      severity: 'WARN',
    });
  }
}

export const authService = new AuthService();
