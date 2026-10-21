import mongoose from 'mongoose';
import Detection from '../src/modules/ai-scanner/Detection.model';
import User from '../src/modules/users/User.model';
import Plant from '../src/modules/plants/Plant.model';
import { hashPassword } from '../src/core/utils/hash';
import { DetectionStatus } from '../src/types';

import './setup';

// ── Mock the Gemini client so tests never hit the real API ──
const mockIdentifyPlant = jest.fn();
jest.mock('../src/modules/ai-scanner/gemini.client', () => ({
  identifyPlant: (...args: unknown[]) => mockIdentifyPlant(...args),
}));

// Mock storageService so storage never throws in tests
jest.mock('../src/core/utils/storageService', () => ({
  storageService: {
    uploadDetectionImage: jest.fn().mockResolvedValue('https://cdn.example.com/test.jpg'),
  },
}));

// Mock sharp so image resizing doesn't fail on test buffers
jest.mock('sharp', () => {
  const chain = {
    resize: () => chain,
    jpeg: () => chain,
    toBuffer: () => Promise.resolve(Buffer.from('fake-image')),
  };
  return jest.fn(() => chain);
});

describe('AI Scanner — Detection.model', () => {
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
      modelVersion: 'gemini-2.5-flash',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    expect(detection.status).toBe('PENDING');
    expect(detection.predictions).toHaveLength(0);
    expect(detection.topMatch).toBeNull();
  });

  it('should update detection to COMPLETE with geminiResult', async () => {
    const detection = await Detection.create({
      user: userId,
      imageUrl: 'https://s3.example.com/test.jpg',
      status: 'PROCESSING',
      modelVersion: 'gemini-2.5-flash',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    await Detection.findByIdAndUpdate(detection._id, {
      status: DetectionStatus.COMPLETE,
      processingTimeMs: 1200,
      geminiResult: {
        isPlant: true,
        description: 'A sacred herb.',
        medicinalUses: ['Stress relief'],
        keyBenefits: ['Adaptogen'],
        partsUsed: ['Leaves'],
        precautions: ['Consult doctor'],
        alternatives: [],
        imageQualityNote: '',
        plantSlug: 'tulsi',
        plantId: null,
      },
    });

    const updated = await Detection.findById(detection._id);
    expect(updated!.status).toBe('COMPLETE');
    expect(updated!.geminiResult?.isPlant).toBe(true);
    expect(updated!.geminiResult?.plantSlug).toBe('tulsi');
  });

  it('should add expert feedback', async () => {
    const detection = await Detection.create({
      user: userId,
      imageUrl: 'https://s3.example.com/test.jpg',
      status: 'COMPLETE',
      modelVersion: 'gemini-2.5-flash',
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

describe('AI Scanner — DetectionService (Gemini mocked)', () => {
  let userId: string;

  beforeEach(async () => {
    mockIdentifyPlant.mockReset();
    const user = await User.create({
      email: `scanner-${Date.now()}@test.com`,
      passwordHash: await hashPassword('TestPass123!'),
      displayName: 'Scanner',
      role: 'USER',
    });
    userId = (user._id as mongoose.Types.ObjectId).toString();
  });

  const fakeBuffer = Buffer.from('fake-jpeg-data');
  const fakeMime = 'image/jpeg';

  it('success — isPlant true returns COMPLETE detection', async () => {
    mockIdentifyPlant.mockResolvedValueOnce({
      isPlant: true,
      commonName: 'Tulsi',
      scientificName: 'Ocimum tenuiflorum',
      family: 'Lamiaceae',
      confidence: 0.92,
      description: 'A sacred aromatic herb.',
      medicinalUses: ['Stress relief', 'Immune support'],
      keyBenefits: ['Adaptogen', 'Antioxidant'],
      partsUsed: ['Leaves', 'Seeds'],
      precautions: ['Avoid during pregnancy'],
      alternatives: [],
      imageQualityNote: '',
    });

    const { detectionService } = await import('../src/modules/ai-scanner/detection.service');
    const result = await detectionService.detect(userId, fakeBuffer, fakeMime);

    expect(result.status).toBe(DetectionStatus.COMPLETE);
    expect(result.isPlant).toBe(true);
    expect(result.topMatch?.commonName).toBe('Tulsi');
    expect(result.processingTimeMs).toBeGreaterThan(0);
  });

  it('isPlant false — returns COMPLETE with isPlant=false', async () => {
    mockIdentifyPlant.mockResolvedValueOnce({
      isPlant: false,
      commonName: '',
      scientificName: '',
      family: '',
      confidence: 0,
      description: '',
      medicinalUses: [],
      keyBenefits: [],
      partsUsed: [],
      precautions: [],
      alternatives: [],
      imageQualityNote: 'No plant detected in image',
    });

    const { detectionService } = await import('../src/modules/ai-scanner/detection.service');
    const result = await detectionService.detect(userId, fakeBuffer, fakeMime);

    expect(result.status).toBe(DetectionStatus.COMPLETE);
    expect(result.isPlant).toBe(false);
  });

  it('Gemini 429 — saves FAILED detection and throws AppError 429', async () => {
    const { AppError } = await import('../src/core/utils/apiResponse');
    mockIdentifyPlant.mockRejectedValueOnce(
      new AppError('AI service is busy, try again in a minute', 429, 'AI_QUOTA'),
    );

    const { detectionService } = await import('../src/modules/ai-scanner/detection.service');
    await expect(detectionService.detect(userId, fakeBuffer, fakeMime)).rejects.toMatchObject({
      statusCode: 429,
      code: 'AI_QUOTA',
    });

    // Detection should be saved as FAILED
    const failed = await Detection.findOne({ user: userId, status: 'FAILED' });
    expect(failed).not.toBeNull();
  });

  it('missing API key — throws 503 AI_NOT_CONFIGURED', async () => {
    const { AppError } = await import('../src/core/utils/apiResponse');
    mockIdentifyPlant.mockRejectedValueOnce(
      new AppError('AI service is not configured', 503, 'AI_NOT_CONFIGURED'),
    );

    const { detectionService } = await import('../src/modules/ai-scanner/detection.service');
    await expect(detectionService.detect(userId, fakeBuffer, fakeMime)).rejects.toMatchObject({
      statusCode: 503,
      code: 'AI_NOT_CONFIGURED',
    });
  });

  it('Plant library match by scientificName', async () => {
    // Create a plant in the DB to match against
    const plant = await Plant.create({
      commonName: 'Tulsi',
      scientificName: 'Ocimum tenuiflorum',
      family: 'Lamiaceae',
      slug: 'tulsi',
      description: 'Sacred herb',
      shortDescription: 'Sacred herb',
      categories: [],
      tags: [],
      isPublished: true,
      createdBy: new mongoose.Types.ObjectId(userId),
    });

    mockIdentifyPlant.mockResolvedValueOnce({
      isPlant: true,
      commonName: 'Tulsi',
      scientificName: 'Ocimum tenuiflorum',
      family: 'Lamiaceae',
      confidence: 0.95,
      description: 'A sacred aromatic herb.',
      medicinalUses: [],
      keyBenefits: [],
      partsUsed: [],
      precautions: [],
      alternatives: [],
      imageQualityNote: '',
    });

    const { detectionService } = await import('../src/modules/ai-scanner/detection.service');
    const result = await detectionService.detect(userId, fakeBuffer, fakeMime);

    expect(result.plantSlug).toBe('tulsi');
    expect(result.plantId).toBe((plant._id as mongoose.Types.ObjectId).toString());
  });
});
