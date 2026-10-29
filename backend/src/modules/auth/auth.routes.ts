import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../core/middleware/validate';
import { authenticate } from '../../core/middleware/auth';
import { requireRecentAuth } from '../../core/middleware/requireRecentAuth';
import { requireFeatureFlag } from '../../core/middleware/requireFeatureFlag';
import { authLimiter, reauthLimiter } from '../../core/middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verify2faSchema,
  changePasswordSchema,
  reauthSchema,
  loginVerify2faSchema,
  disable2faSchema,
} from './auth.validators';
import passport from 'passport';

const router = Router();

router.post(
  '/register',
  requireFeatureFlag('new_user_registration'),
  authLimiter,
  validate(registerSchema),
  authController.register,
);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/2fa/login-verify', authLimiter, validate(loginVerify2faSchema), authController.loginVerify2fa);
router.post('/logout', authenticate(), authController.logout);
router.post('/refresh', authController.refresh);
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err: any, user: any) => {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    if (err) {
      const msg = encodeURIComponent(err.message || 'Google authentication failed');
      return res.redirect(`${clientUrl}/oauth/callback?error=${msg}`);
    }
    if (!user) {
      return res.redirect(`${clientUrl}/oauth/callback?error=Authentication%20failed`);
    }
    req.user = user;
    return authController.googleCallback(req, res);
  })(req, res, next);
});

// Step-up re-authentication
router.post('/reauth', authenticate(), reauthLimiter, validate(reauthSchema), authController.reauth);

// 2FA Management
router.get('/2fa/status', authenticate(), authController.get2faStatus);
router.post('/2fa/setup', authenticate(), authController.setup2fa);
router.post('/2fa/verify', authenticate(), validate(verify2faSchema), authController.verify2fa);
router.post('/2fa/regenerate-backup-codes', authenticate(), requireRecentAuth, authController.regenerateBackupCodes);
router.post('/2fa/disable', authenticate(), requireRecentAuth, validate(disable2faSchema), authController.disable2fa);

router.post('/logout-all', authenticate(), authController.logoutAll);
router.post('/change-password', authenticate(), validate(changePasswordSchema), authController.changePassword);

export default router;
