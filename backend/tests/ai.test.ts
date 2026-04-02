import mongoose from 'mongoose';
import Detection from '../src/models/Detection';
import User from '../src/models/User';
import { hashPassword } from '../src/utils/hash';

import './setup';

describe('AI Detection', () => {
  let userId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    const user = await User.create({
      email: 'detector@test.com',
      passwordHash: await hashPassword('TestPass123!'),
      displayName: 'Detector',
      role: 'USER',
    });
    userId = user._id as mongoose.Types.ObjectId;
  });

  it('should create a detection with PENDING status', async () => {
    const detection = await Detection.create({
      user: userId,
      imageUrl: 'https://s3.example.com/test.jpg',
      status: 'PENDING',
      modelVersion: 'v2.3.1',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    expect(detection.status).toBe('PENDING');
    expect(detection.predictions).toHaveLength(0);
    expect(detection.topMatch).toBeNull();
  });

  it('should update detection with predictions', async () => {
    const detection = await Detection.create({
      user: userId,
      imageUrl: 'https://s3.example.com/test.jpg',
      status: 'PENDING',
      modelVersion: 'v2.3.1',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const plantId = new mongoose.Types.ObjectId();
    await Detection.findByIdAndUpdate(detection._id, {
      status: 'COMPLETE',
      predictions: [
        { plant: plantId, confidence: 0.95, rank: 1, commonName: 'Tulsi' },
        { plant: new mongoose.Types.ObjectId(), confidence: 0.85, rank: 2, commonName: 'Holy Basil' },
      ],
      topMatch: plantId,
      processingTimeMs: 1500,
    });

    const updated = await Detection.findById(detection._id);
    expect(updated!.status).toBe('COMPLETE');
    expect(updated!.predictions).toHaveLength(2);
    expect(updated!.topMatch!.toString()).toBe(plantId.toString());
    expect(updated!.processingTimeMs).toBe(1500);
  });

  it('should add expert feedback', async () => {
    const detection = await Detection.create({
      user: userId,
      imageUrl: 'https://s3.example.com/test.jpg',
      status: 'COMPLETE',
      modelVersion: 'v2.3.1',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const reviewerId = new mongoose.Types.ObjectId();
    await Detection.findByIdAndUpdate(detection._id, {
      feedback: {
        reviewer: reviewerId,
        isCorrect: true,
        notes: 'Correct identification',
        reviewedAt: new Date(),
      },
    });

    const updated = await Detection.findById(detection._id);
    expect(updated!.feedback!.isCorrect).toBe(true);
    expect(updated!.feedback!.reviewer.toString()).toBe(reviewerId.toString());
  });

  it('should have TTL index on expiresAt', async () => {
    const indexes = await Detection.collection.indexes();
    const ttlIndex = indexes.find(
      (idx) => idx.key && 'expiresAt' in idx.key && idx.expireAfterSeconds === 0,
    );
    expect(ttlIndex).toBeDefined();
  });
});
