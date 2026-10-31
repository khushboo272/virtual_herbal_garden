import request from 'supertest';
import app from '../src/app';
import User from '../src/modules/users/User.model';
import Notification from '../src/modules/notifications/Notification.model';
import { notificationService } from '../src/modules/notifications/notification.service';
import { clearMissingPlantAlertCache } from '../src/modules/library/plant.controller';
import { signAccessToken } from '../src/core/utils/jwt';
import { hashPassword } from '../src/core/utils/hash';
import { UserRole, NotificationType } from '../src/types';
import './setup';

describe('Missing Plant Search Alert & Registration Request TDD Suite', () => {
  let regularUser: any;
  let regularToken: string;
  let botanistUser: any;
  let adminUser: any;
  let superAdminUser: any;

  beforeEach(async () => {
    clearMissingPlantAlertCache();
    await User.deleteMany({});
    await Notification.deleteMany({});

    const passwordHash = await hashPassword('TestPass123!');

    regularUser = await User.create({
      email: `user-${Date.now()}@example.com`,
      passwordHash,
      displayName: 'Normal Visitor',
      role: UserRole.USER,
      isActive: true,
    });
    regularToken = signAccessToken({
      sub: regularUser._id.toString(),
      email: regularUser.email,
      role: UserRole.USER,
    });

    botanistUser = await User.create({
      email: `botanist-${Date.now()}@example.com`,
      passwordHash,
      displayName: 'Field Botanist',
      role: UserRole.BOTANIST,
      isActive: true,
    });

    adminUser = await User.create({
      email: `admin-${Date.now()}@example.com`,
      passwordHash,
      displayName: 'Garden Admin',
      role: UserRole.ADMIN,
      isActive: true,
    });

    superAdminUser = await User.create({
      email: `superadmin-${Date.now()}@example.com`,
      passwordHash,
      displayName: 'Chief Botanist & Super Admin',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    });
  });

  describe('notificationService.notifyBotanistsAndAdmins', () => {
    it('dispatches notifications to all BOTANIST, ADMIN, and SUPER_ADMIN users while excluding regular USERs', async () => {
      await notificationService.notifyBotanistsAndAdmins(
        NotificationType.SYSTEM,
        'Botanical Alert',
        'Species inquiry alert',
        '/dashboard/moderation',
      );

      const notifications = await Notification.find().lean();
      expect(notifications.length).toBe(3);

      const recipientIds = notifications.map((n: any) => n.user.toString());
      expect(recipientIds).toContain(botanistUser._id.toString());
      expect(recipientIds).toContain(adminUser._id.toString());
      expect(recipientIds).toContain(superAdminUser._id.toString());
      expect(recipientIds).not.toContain(regularUser._id.toString());
    });
  });

  describe('POST /api/v1/plants/missing-search-alert', () => {
    it('alerts botanists, admins, and superadmins when an uncataloged plant is searched', async () => {
      const res = await request(app)
        .post('/api/v1/plants/missing-search-alert')
        .send({
          query: 'Japanese Maple',
          scientificName: 'Acer palmatum',
          family: 'Sapindaceae',
          source: 'ai-scanner',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const notifications = await Notification.find().lean();
      expect(notifications.length).toBe(3);

      const sample = notifications[0] as any;
      expect(sample.title).toContain('Plant Not in Dataset');
      expect(sample.body).toContain('Japanese Maple');
      expect(sample.body).toContain('Acer palmatum');
    });

    it('deduplicates alerts for the same plant within an hour to avoid notification spam', async () => {
      // First alert
      await request(app)
        .post('/api/v1/plants/missing-search-alert')
        .send({ query: 'Japanese Maple', scientificName: 'Acer palmatum' });

      // Immediate repeated alert
      const res2 = await request(app)
        .post('/api/v1/plants/missing-search-alert')
        .send({ query: 'Japanese Maple', scientificName: 'Acer palmatum' });

      expect(res2.status).toBe(200);
      expect(res2.body.deduplicated).toBe(true);

      // Notification count remains 3 (not 6)
      const count = await Notification.countDocuments();
      expect(count).toBe(3);
    });
  });

  describe('POST /api/v1/plants/register-request', () => {
    it('accepts explicit plant registration requests and returns thank you confirmation with pre-filled botanist application link', async () => {
      const res = await request(app)
        .post('/api/v1/plants/register-request')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          commonName: 'Japanese Maple',
          scientificName: 'Acer palmatum',
          family: 'Sapindaceae',
          description: 'Popular ornamental deciduous tree with red-purple lace foliage.',
          medicinalUses: ['Traditional East Asian decoctions for heat-clearing'],
          imageUrl: 'https://example.com/maple.jpg',
          notes: 'Identified via AI Scanner — please review and register in herbal catalog.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Thank you for contributing');
      expect(res.body.redirect).toBeDefined();
      expect(res.body.redirect.url).toBe('/dashboard/become-contributor');
      expect(res.body.redirect.prefill.motivation).toContain('Japanese Maple');
      expect(res.body.redirect.prefill.qualifications).toBeDefined();

      const notifications = await Notification.find().lean();
      expect(notifications.length).toBe(3);

      const sample = notifications[0] as any;
      expect(sample.title).toContain('New Plant Registration Request');
      expect(sample.body).toContain('Normal Visitor');
      expect(sample.body).toContain('Japanese Maple');
    });
  });

  describe('GET & PATCH /api/v1/plants/registration-requests', () => {
    it('allows botanists and admins to view and update registration requests in moderation queue', async () => {
      const botanistToken = signAccessToken({
        sub: botanistUser._id.toString(),
        email: botanistUser.email,
        role: UserRole.BOTANIST,
      });

      // 1. Submit request
      const createRes = await request(app)
        .post('/api/v1/plants/register-request')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          commonName: 'Ashwagandha Variant',
          scientificName: 'Withania somnifera var',
          family: 'Solanaceae',
          description: 'A special high-altitude variant observed in northern slopes.',
          medicinalUses: ['Adaptogen', 'Stress relief'],
        });

      expect(createRes.status).toBe(201);
      const requestId = createRes.body.requestId || createRes.body.request?._id;
      expect(requestId).toBeDefined();

      // 2. Botanist views requests
      const listRes = await request(app)
        .get('/api/v1/plants/registration-requests?status=PENDING')
        .set('Authorization', `Bearer ${botanistToken}`);

      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body.data)).toBe(true);
      expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);
      expect(listRes.body.data[0].commonName).toBe('Ashwagandha Variant');

      // 3. Botanist updates status to RESEARCHING
      const patchRes = await request(app)
        .patch(`/api/v1/plants/registration-requests/${requestId}/status`)
        .set('Authorization', `Bearer ${botanistToken}`)
        .send({
          status: 'RESEARCHING',
          adminNotes: 'Field botanist reviewing herbarium records.',
        });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.data.status).toBe('RESEARCHING');
      expect(patchRes.body.data.adminNotes).toBe('Field botanist reviewing herbarium records.');
    });
  });
});
