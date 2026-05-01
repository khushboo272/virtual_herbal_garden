import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { sendSuccess, sendCreated, sendError } from '../utils/apiResponse';
import { env } from '../config/env';
import { signAccessToken, generateRefreshToken, hashRefreshToken } from '../utils/jwt';
import { UserRole } from '../types';
import RefreshToken from '../models/RefreshToken';

export class AuthController {
  async register(req: Request, res: Response) {
    const { email, password, displayName } = req.body;
    const user = await authService.register(email, password, displayName);
    sendCreated(res, { user, message: 'Registration successful. Please verify your email.' });
  }

  async login(req: Request, res: Response) {
    const { email, password, totpCode } = req.body;
    const result = await authService.login(email, password, req, totpCode);

    if (result.requires2fa) {
      sendSuccess(res, { requires2fa: true, message: 'Please provide your 2FA code' });
      return;
    }

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/api/v1/auth',
    });

    sendSuccess(res, {
      accessToken: result.accessToken,
      user: result.user,
    });
  }

  async logout(req: Request, res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    await authService.logout(req.user!.sub, refreshToken);
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    sendSuccess(res, { message: 'Logged out successfully' });
  }

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      sendError(res, 'NO_TOKEN', 'No refresh token provided', 401);
      return;
    }

    const tokens = await authService.refresh(refreshToken, req);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    });

    sendSuccess(res, { accessToken: tokens.accessToken });
  }

  async verifyEmail(req: Request, res: Response) {
    const { email, code } = req.body;
    await authService.verifyEmail(email, code);
    sendSuccess(res, { message: 'Email verified successfully' });
  }

  async forgotPassword(req: Request, res: Response) {
    await authService.forgotPassword(req.body.email);
    sendSuccess(res, { message: 'If the email exists, a reset link has been sent' });
  }

  async resetPassword(req: Request, res: Response) {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    sendSuccess(res, { message: 'Password reset successful' });
  }

  async setup2fa(req: Request, res: Response) {
    const result = await authService.setup2fa(req.user!.sub);
    sendSuccess(res, result);
  }

  async verify2fa(req: Request, res: Response) {
    await authService.verify2fa(req.user!.sub, req.body.totpCode);
    sendSuccess(res, { message: '2FA enabled successfully' });
  }

  async logoutAll(req: Request, res: Response) {
    await authService.logoutAll(req.user!.sub);
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    sendSuccess(res, { message: 'Logged out from all devices' });
  }

  async googleCallback(req: Request, res: Response) {
    try {
      // Passport Google strategy returns a JwtPayload: { sub, email, role }
      const user = req.user as unknown as { sub: string; email: string; role: string };
      if (!user) {
        return res.redirect(`${env.CLIENT_URL}/?error=oauth_failed`);
      }

      const accessToken = signAccessToken({ sub: user.sub, email: user.email, role: user.role as UserRole });
      const refreshTokenValue = generateRefreshToken();
      await RefreshToken.create({
        user: user.sub, tokenHash: hashRefreshToken(refreshTokenValue),
        deviceInfo: { ua: req.headers['user-agent'] || '', ip: req.ip || '' },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      res.cookie('refreshToken', refreshTokenValue, {
        httpOnly: true, secure: env.NODE_ENV === 'production',
        sameSite: 'strict', maxAge: 30 * 24 * 60 * 60 * 1000, path: '/api/v1/auth',
      });
      res.redirect(`${env.CLIENT_URL}/oauth/callback?token=${accessToken}`);
    } catch (err) {
      console.error('Google callback error:', err);
      res.redirect(`${env.CLIENT_URL}/?error=oauth_failed`);
    }
  }
}

export const authController = new AuthController();
