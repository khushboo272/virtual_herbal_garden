/**
 * Unit tests for the /users/me/stats endpoint.
 * Per PRD: USER dashboard displays plantsExplored, toursCompleted, learningHours, detections.
 *
 * TDD Step 1: Write FAILING test first.
 */
import './setup';
import mongoose from 'mongoose';
import User from '../src/modules/users/User.model';
import Bookmark from '../src/modules/users/Bookmark.model';
import Detection from '../src/modules/ai-detection/Detection.model';
import { hashPassword } from '../src/core/utils/hash';

describe('UserService.getStats', () => {
  let userId: string;

  beforeEach(async () => {
    const user = await User.create({
      email: 'statstest@example.com',
      passwordHash: await hashPassword('TestPass123!'),
      displayName: 'Stats Test User',
      role: 'USER',
    });
    userId = user._id.toString();
  });

  it('should return stats object with correct shape', async () => {
    // Import the service (will fail until we implement getStats)
    const { userService } = await import('../src/modules/users/user.service');

    const stats = await userService.getStats(userId);

    expect(stats).toHaveProperty('plantsExplored');
    expect(stats).toHaveProperty('toursCompleted');
    expect(stats).toHaveProperty('learningHours');
    expect(stats).toHaveProperty('detections');
    expect(typeof stats.plantsExplored).toBe('number');
    expect(typeof stats.toursCompleted).toBe('number');
    expect(typeof stats.learningHours).toBe('number');
    expect(typeof stats.detections).toBe('number');
  });

  it('should return zero counts for a new user', async () => {
    const { userService } = await import('../src/modules/users/user.service');

    const stats = await userService.getStats(userId);

    expect(stats.plantsExplored).toBe(0);
    expect(stats.toursCompleted).toBe(0);
    expect(stats.learningHours).toBe(0);
    expect(stats.detections).toBe(0);
  });

  it('should count detections for the user', async () => {
    // Create some detections for this user
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    await Detection.create([
      { user: userId, imageUrl: 'test1.jpg', status: 'COMPLETE', modelVersion: 'v1', expiresAt },
      { user: userId, imageUrl: 'test2.jpg', status: 'COMPLETE', modelVersion: 'v1', expiresAt },
      { user: userId, imageUrl: 'test3.jpg', status: 'PENDING', modelVersion: 'v1', expiresAt },
    ]);

    const { userService } = await import('../src/modules/users/user.service');
    const stats = await userService.getStats(userId);

    expect(stats.detections).toBe(3);
  });

  it('should count bookmarks as plantsExplored', async () => {
    const plantId1 = new mongoose.Types.ObjectId();
    const plantId2 = new mongoose.Types.ObjectId();

    await Bookmark.create([
      { user: userId, entityType: 'PLANT', entityId: plantId1 },
      { user: userId, entityType: 'PLANT', entityId: plantId2 },
    ]);

    const { userService } = await import('../src/modules/users/user.service');
    const stats = await userService.getStats(userId);

    expect(stats.plantsExplored).toBe(2);
  });

  it('should throw error for non-existent user', async () => {
    const { userService } = await import('../src/modules/users/user.service');
    const fakeId = new mongoose.Types.ObjectId().toString();

    await expect(userService.getStats(fakeId)).rejects.toThrow('User not found');
  });
});
