import { Worker, Job } from 'bullmq';
import { redis } from '../../core/config/redis';
import { emailService } from './email.service';
import { logger } from '../../core/utils/logger';

interface EmailJobData {
  type: 'verification' | 'password-reset';
  to: string;
  otp?: string;
  resetUrl?: string;
}

import { env } from '../../core/config/env';

const isMock = env.REDIS_URL === 'redis://localhost:6379' || env.REDIS_URL.includes('mock');

const emailWorker = isMock ? null : new Worker(
  'email',
  async (job: Job<EmailJobData>) => {
    const { type, to, otp, resetUrl } = job.data;
    if (type === 'verification' && otp) {
      await emailService.sendVerificationEmail(to, otp);
    } else if (type === 'password-reset' && resetUrl) {
      await emailService.sendPasswordResetEmail(to, resetUrl);
    }
  },
  { connection: redis, concurrency: 10 },
);

if (emailWorker) {
  emailWorker.on('failed', (job, err) => {
    logger.error(`Email job ${job?.id} failed:`, err);
  });
}

export default emailWorker;
