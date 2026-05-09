import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(2).max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  totpCode: z.string().length(6).optional(),
});

export const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, 'OTP code must be 6 digits'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
});

export const setup2faSchema = z.object({});

export const verify2faSchema = z.object({
  totpCode: z.string().length(6, 'TOTP code must be 6 digits'),
});
