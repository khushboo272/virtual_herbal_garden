import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Plant from '../modules/library/Plant.model';
import Remedy from '../modules/remedies/Remedy.model';
import { ContentStatus } from '../types';
import { getPendingReviewPredicate } from '../modules/admin/moderation.service';

dotenv.config();

async function backfill() {
  const uri = process.env.MONGODB_URI || '';
  const dbName = process.env.MONGODB_DB_NAME || 'herbal_garden_dev';
  await mongoose.connect(uri, { dbName });
  console.log(`[Backfill] Connected to database: ${mongoose.connection.name}`);

  // Counts before
  const plantsBefore = {
    total: await Plant.countDocuments({ isDeleted: false }),
    pending: await Plant.countDocuments(getPendingReviewPredicate()),
    published: await Plant.countDocuments({ status: ContentStatus.PUBLISHED, isDeleted: false }),
    legacyPending: await Plant.countDocuments({ status: { $in: ['pending', 'PENDING'] } }),
  };

  const remediesBefore = {
    total: await Remedy.countDocuments({ isDeleted: false }),
    pending: await Remedy.countDocuments(getPendingReviewPredicate()),
    published: await Remedy.countDocuments({ status: ContentStatus.PUBLISHED, isDeleted: false }),
    legacyPending: await Remedy.countDocuments({ status: { $in: ['pending', 'PENDING'] } }),
  };

  console.log('[Backfill] Counts BEFORE:');
  console.log('  Plants:', JSON.stringify(plantsBefore));
  console.log('  Remedies:', JSON.stringify(remediesBefore));

  // Perform backfill
  // 1. Normalize legacy status values to ContentStatus.PENDING_REVIEW
  await Plant.updateMany(
    { status: { $in: ['pending', 'PENDING'] } },
    { $set: { status: ContentStatus.PENDING_REVIEW, isPublished: false } },
  );
  await Remedy.updateMany(
    { status: { $in: ['pending', 'PENDING'] } },
    { $set: { status: ContentStatus.PENDING_REVIEW, isPublished: false } },
  );

  // 2. Ensure PENDING_REVIEW items have isPublished: false and a valid submittedAt
  const pendingPlantsWithoutDate = await Plant.find({
    status: ContentStatus.PENDING_REVIEW,
    submittedAt: { $exists: false },
  });
  for (const p of pendingPlantsWithoutDate) {
    p.submittedAt = p.createdAt || new Date();
    p.isPublished = false;
    await p.save();
  }

  const pendingRemediesWithoutDate = await Remedy.find({
    status: ContentStatus.PENDING_REVIEW,
    submittedAt: { $exists: false },
  });
  for (const r of pendingRemediesWithoutDate) {
    r.submittedAt = (r as any).createdAt || new Date();
    r.isPublished = false;
    await r.save();
  }

  // 3. Ensure PUBLISHED items have isPublished: true
  await Plant.updateMany(
    { status: ContentStatus.PUBLISHED, isPublished: false },
    { $set: { isPublished: true } },
  );
  await Remedy.updateMany(
    { status: ContentStatus.PUBLISHED, isPublished: false },
    { $set: { isPublished: true } },
  );

  // Counts after
  const plantsAfter = {
    total: await Plant.countDocuments({ isDeleted: false }),
    pending: await Plant.countDocuments(getPendingReviewPredicate()),
    published: await Plant.countDocuments({ status: ContentStatus.PUBLISHED, isDeleted: false }),
    legacyPending: await Plant.countDocuments({ status: { $in: ['pending', 'PENDING'] } }),
  };

  const remediesAfter = {
    total: await Remedy.countDocuments({ isDeleted: false }),
    pending: await Remedy.countDocuments(getPendingReviewPredicate()),
    published: await Remedy.countDocuments({ status: ContentStatus.PUBLISHED, isDeleted: false }),
    legacyPending: await Remedy.countDocuments({ status: { $in: ['pending', 'PENDING'] } }),
  };

  console.log('[Backfill] Counts AFTER:');
  console.log('  Plants:', JSON.stringify(plantsAfter));
  console.log('  Remedies:', JSON.stringify(remediesAfter));

  await mongoose.disconnect();
}

backfill().catch((err) => {
  console.error('[Backfill] Error:', err);
  process.exit(1);
});
