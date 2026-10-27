import dotenv from 'dotenv';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app';
import { UserRole } from '../types';
import User from '../modules/users/User.model';
import { signAccessToken } from '../core/utils/jwt';
import {
  adminUsersResponseSchema,
  moderationSummarySchema,
  moderationQueueResponseSchema,
  contentListResponseSchema,
  dashboardSummarySchema,
  roleApplicationsResponseSchema,
  adminStatsSchema,
  adminOverviewStatsSchema,
  adminAnalyticsSchema,
  adminFlaggedReviewsResponseSchema,
  adminAuditLogsResponseSchema,
  systemHealthSchema,
  systemPublicConfigSchema,
} from '../modules/admin/adminSchemas';

dotenv.config();

interface CheckResult {
  endpoint: string;
  status: number;
  contractValid: boolean;
  message: string;
}

async function getAdminToken(): Promise<string> {
  const email = process.env.ADMIN_TEST_EMAIL;
  const password = process.env.ADMIN_TEST_PASSWORD;

  // 1. Try login endpoint via supertest(app)
  if (email && password) {
    try {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password });
      if (res.status === 200 && res.body?.data?.accessToken) {
        return res.body.data.accessToken;
      }
    } catch {
      // fallback
    }
  }

  let adminUser = null;
  if (email) {
    adminUser = await User.findOne({ email });
  }
  if (!adminUser) {
    adminUser = await User.findOne({ role: { $in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] } });
  }

  if (adminUser) {
    return signAccessToken({
      sub: adminUser._id.toString(),
      email: adminUser.email,
      role: (adminUser.role || UserRole.ADMIN) as UserRole,
    });
  }

  // Fallback signed token for testing
  return signAccessToken({
    sub: 'contract-check-admin-id',
    email: 'admin@virtualherbal.garden',
    role: UserRole.ADMIN,
  });
}

async function runContractChecks() {
  if (mongoose.connection.readyState === 0) {
    const uri = process.env.MONGODB_URI || '';
    const dbName = process.env.MONGODB_DB_NAME || 'herbal_garden_dev';
    await mongoose.connect(uri, { dbName });
  }

  const token = await getAdminToken();
  const results: CheckResult[] = [];


  const checks = [
    {
      name: 'GET /admin/dashboard-summary',
      path: '/api/v1/admin/dashboard-summary',
      validate: (body: any) => {
        const target = body?.data !== undefined ? body.data : body;
        return dashboardSummarySchema.safeParse(target);
      },
    },
    {
      name: 'GET /admin/moderation/summary',
      path: '/api/v1/admin/moderation/summary',
      validate: (body: any) => {
        const target = body?.data !== undefined ? body.data : body;
        return moderationSummarySchema.safeParse(target);
      },
    },
    {
      name: 'GET /admin/moderation?type=plant',
      path: '/api/v1/admin/moderation?type=plant',
      validate: (body: any) => {
        const rawItems = Array.isArray(body?.data) ? body.data : body?.data?.items || [];
        const rawPagination = body?.meta || body?.data?.pagination || { total: rawItems.length, page: 1, limit: 20, totalPages: 1 };
        return moderationQueueResponseSchema.safeParse({ items: rawItems, pagination: rawPagination });
      },
    },
    {
      name: 'GET /admin/moderation?type=remedy',
      path: '/api/v1/admin/moderation?type=remedy',
      validate: (body: any) => {
        const rawItems = Array.isArray(body?.data) ? body.data : body?.data?.items || [];
        const rawPagination = body?.meta || body?.data?.pagination || { total: rawItems.length, page: 1, limit: 20, totalPages: 1 };
        return moderationQueueResponseSchema.safeParse({ items: rawItems, pagination: rawPagination });
      },
    },
    {
      name: 'GET /admin/content/plant',
      path: '/api/v1/admin/content/plant',
      validate: (body: any) => {
        const rawItems = Array.isArray(body?.data) ? body.data : body?.data?.items || [];
        const rawPagination = body?.meta || body?.data?.pagination || { total: rawItems.length, page: 1, limit: 20, totalPages: 1 };
        return contentListResponseSchema.safeParse({ items: rawItems, pagination: rawPagination });
      },
    },
    {
      name: 'GET /admin/content/plants',
      path: '/api/v1/admin/content/plants',
      validate: (body: any) => {
        const rawItems = Array.isArray(body?.data) ? body.data : body?.data?.items || [];
        const rawPagination = body?.meta || body?.data?.pagination || { total: rawItems.length, page: 1, limit: 20, totalPages: 1 };
        return contentListResponseSchema.safeParse({ items: rawItems, pagination: rawPagination });
      },
    },
    {
      name: 'GET /admin/content/remedy',
      path: '/api/v1/admin/content/remedy',
      validate: (body: any) => {
        const rawItems = Array.isArray(body?.data) ? body.data : body?.data?.items || [];
        const rawPagination = body?.meta || body?.data?.pagination || { total: rawItems.length, page: 1, limit: 20, totalPages: 1 };
        return contentListResponseSchema.safeParse({ items: rawItems, pagination: rawPagination });
      },
    },
    {
      name: 'GET /admin/content/remedies',
      path: '/api/v1/admin/content/remedies',
      validate: (body: any) => {
        const rawItems = Array.isArray(body?.data) ? body.data : body?.data?.items || [];
        const rawPagination = body?.meta || body?.data?.pagination || { total: rawItems.length, page: 1, limit: 20, totalPages: 1 };
        return contentListResponseSchema.safeParse({ items: rawItems, pagination: rawPagination });
      },
    },
    {
      name: 'GET /admin/users',
      path: '/api/v1/admin/users',
      validate: (body: any) => {
        const target = body?.data !== undefined ? body.data : body;
        return adminUsersResponseSchema.safeParse(target);
      },
    },
    {
      name: 'GET /admin/role-applications',
      path: '/api/v1/admin/role-applications',
      validate: (body: any) => {
        const rawItems = Array.isArray(body?.data) ? body.data : body?.data?.items || [];
        const rawPagination = body?.meta || body?.data?.pagination || { total: rawItems.length, page: 1, limit: 20, totalPages: 1 };
        return roleApplicationsResponseSchema.safeParse({ items: rawItems, pagination: rawPagination });
      },
    },
    {
      name: 'GET /admin/stats',
      path: '/api/v1/admin/stats',
      validate: (body: any) => {
        const target = body?.data !== undefined ? body.data : body;
        return adminStatsSchema.safeParse(target);
      },
    },
    {
      name: 'GET /admin/stats/overview',
      path: '/api/v1/admin/stats/overview',
      validate: (body: any) => {
        const target = body?.data !== undefined ? body.data : body;
        return adminOverviewStatsSchema.safeParse(target);
      },
    },
    {
      name: 'GET /admin/stats/analytics',
      path: '/api/v1/admin/stats/analytics',
      validate: (body: any) => {
        const target = body?.data !== undefined ? body.data : body;
        return adminAnalyticsSchema.safeParse(target);
      },
    },
    {
      name: 'GET /admin/reviews/flagged',
      path: '/api/v1/admin/reviews/flagged',
      validate: (body: any) => {
        const rawItems = Array.isArray(body?.data) ? body.data : body?.data?.reviews || [];
        const rawPagination = body?.meta || body?.data?.meta || { total: rawItems.length, page: 1, limit: 20, totalPages: 1 };
        return adminFlaggedReviewsResponseSchema.safeParse({ items: rawItems, pagination: rawPagination });
      },
    },
    {
      name: 'GET /admin/audit-logs',
      path: '/api/v1/admin/audit-logs',
      validate: (body: any) => {
        const rawItems = Array.isArray(body?.data) ? body.data : body?.data?.logs || [];
        const rawPagination = body?.meta || body?.data?.meta || { total: rawItems.length, page: 1, limit: 20, totalPages: 1 };
        return adminAuditLogsResponseSchema.safeParse({ items: rawItems, pagination: rawPagination });
      },
    },
    {
      name: 'GET /admin/system/health',
      path: '/api/v1/admin/system/health',
      validate: (body: any) => {
        const target = body?.data !== undefined ? body.data : body;
        return systemHealthSchema.safeParse(target);
      },
    },
    {
      name: 'GET /admin/system/config/public',
      path: '/api/v1/admin/system/config/public',
      validate: (body: any) => {
        const target = body?.data !== undefined ? body.data : body;
        return systemPublicConfigSchema.safeParse(target);
      },
    },
  ];

  for (const check of checks) {
    let res: any;
    try {
      res = await request(app)
        .get(check.path)
        .set('Authorization', `Bearer ${token}`);
    } catch (err: any) {
      results.push({
        endpoint: check.name,
        status: 500,
        contractValid: false,
        message: `HTTP request failed: ${err.message}`,
      });
      continue;
    }

    if (res.status >= 400) {
      results.push({
        endpoint: check.name,
        status: res.status,
        contractValid: false,
        message: `HTTP Error: ${res.body?.error?.message || res.text || res.status}`,
      });
      continue;
    }

    const parseResult = check.validate(res.body);
    if (!parseResult.success) {
      const issueDetails = parseResult.error.issues
        .map((i: any) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      results.push({
        endpoint: check.name,
        status: res.status,
        contractValid: false,
        message: `Schema mismatch: ${issueDetails}`,
      });
    } else {
      results.push({
        endpoint: check.name,
        status: res.status,
        contractValid: true,
        message: 'Valid contract schema',
      });
    }
  }

  // Print results table
  console.log('\n========================================================================================');
  console.log('                          ADMIN API CONTRACT CHECK RESULTS                              ');
  console.log('========================================================================================');
  console.log(
    '| Status | Code | ' +
      'Endpoint'.padEnd(38) +
      ' | ' +
      'Result'.padEnd(30) +
      ' |',
  );
  console.log('----------------------------------------------------------------------------------------');

  let failedCount = 0;
  for (const r of results) {
    const statusLabel = r.contractValid ? ' PASS ' : ' FAIL ';
    if (!r.contractValid) failedCount++;
    console.log(
      `| [${statusLabel}] | ${String(r.status).padEnd(4)} | ${r.endpoint.padEnd(38)} | ${r.message.padEnd(30).slice(0, 30)} |`,
    );
  }
  console.log('========================================================================================');
  console.log(`Total checks: ${results.length} | Passed: ${results.length - failedCount} | Failed: ${failedCount}\n`);

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runContractChecks().catch((err) => {
  console.error('[Contract Check] Fatal error:', err);
  process.exit(1);
});
