import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await transporter.sendMail({
        from: env.EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      logger.info(`Email sent to ${options.to}: ${options.subject}`);
    } catch (error) {
      logger.error('Email send failed:', error);
      throw error;
    }
  }

  async sendVerificationEmail(email: string, otp: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Verify your email - Virtual Herbal Garden',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2d6a4f;">Virtual Herbal Garden</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #40916c; letter-spacing: 8px; text-align: center;">${otp}</h1>
          <p>This code expires in 10 minutes.</p>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Reset your password - Virtual Herbal Garden',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2d6a4f;">Virtual Herbal Garden</h2>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #40916c; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a>
          <p>This link expires in 30 minutes.</p>
        </div>
      `,
    });
  }
}

export const emailService = new EmailService();
