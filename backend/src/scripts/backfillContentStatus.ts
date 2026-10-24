import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
  }

  await mongoose.connect(mongoUri, { dbName: process.env.MONGODB_DB_NAME || 'herbal_garden_dev' });
  const dbName = mongoose.connection.name || 'unknown';
  console.log(`Connected to database: ${dbName}`);

  const Plant = (await import('../modules/library/Plant.model')).default;
  const Remedy = (await import('../modules/remedies/Remedy.model')).default;

  // 1. Initial counts
  const [totalPlants, publishedPlants, totalRemedies, publishedRemedies] = await Promise.all([
    Plant.countDocuments(),
    Plant.countDocuments({ isPublished: true }),
    Remedy.countDocuments(),
    Remedy.countDocuments({ isPublished: true }),
  ]);

  console.log('──────────────────────────────────────────────────────');
  console.log('📊 Status Backfill: Counts Before');
  console.log(`Plants Total:     ${totalPlants} (Published: ${publishedPlants}, Unpublished: ${totalPlants - publishedPlants})`);
  console.log(`Remedies Total:   ${totalRemedies} (Published: ${publishedRemedies}, Unpublished: ${totalRemedies - publishedRemedies})`);
  console.log('──────────────────────────────────────────────────────');

  // 2. Backfill Plants
  const plants = await Plant.find({});
  let plantsUpdated = 0;
  for (const plant of plants) {
    let changed = false;
    const targetStatus = plant.isPublished ? 'PUBLISHED' : (plant.status || 'DRAFT');
    if (!plant.status || plant.status !== targetStatus) {
      plant.status = targetStatus as any;
      changed = true;
    }
    const targetOwner = plant.owner || plant.createdBy || plant.uploadedBy;
    if (targetOwner && (!plant.owner || plant.owner.toString() !== targetOwner.toString())) {
      plant.owner = targetOwner as any;
      changed = true;
    }
    if (!plant.reviewNotes) {
      plant.reviewNotes = [];
      changed = true;
    }
    if (!plant.references) {
      plant.references = [];
      changed = true;
    }
    if (changed) {
      await plant.save();
      plantsUpdated++;
    }
  }

  // 3. Backfill Remedies
  const remedies = await Remedy.find({});
  let remediesUpdated = 0;
  for (const remedy of remedies) {
    let changed = false;
    const targetStatus = remedy.isPublished ? 'PUBLISHED' : (remedy.status || 'DRAFT');
    if (!remedy.status || remedy.status !== targetStatus) {
      remedy.status = targetStatus as any;
      changed = true;
    }
    const targetOwner = remedy.owner || remedy.createdBy;
    if (targetOwner && (!remedy.owner || remedy.owner.toString() !== targetOwner.toString())) {
      remedy.owner = targetOwner as any;
      changed = true;
    }
    if (!remedy.reviewNotes) {
      remedy.reviewNotes = [];
      changed = true;
    }
    if (!remedy.references) {
      remedy.references = [];
      changed = true;
    }
    if (changed) {
      await remedy.save();
      remediesUpdated++;
    }
  }

  // 4. Counts after
  const [
    plantsPublishedAfter,
    plantsDraftAfter,
    remediesPublishedAfter,
    remediesDraftAfter,
  ] = await Promise.all([
    Plant.countDocuments({ status: 'PUBLISHED' }),
    Plant.countDocuments({ status: 'DRAFT' }),
    Remedy.countDocuments({ status: 'PUBLISHED' }),
    Remedy.countDocuments({ status: 'DRAFT' }),
  ]);

  console.log('──────────────────────────────────────────────────────');
  console.log('📊 Status Backfill: Counts After');
  console.log(`Plants Updated:    ${plantsUpdated} (Published: ${plantsPublishedAfter}, Drafts: ${plantsDraftAfter})`);
  console.log(`Remedies Updated:  ${remediesUpdated} (Published: ${remediesPublishedAfter}, Drafts: ${remediesDraftAfter})`);
  console.log('──────────────────────────────────────────────────────');
  console.log('✅ Backfill complete successfully.');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Backfill error:', err);
  process.exit(1);
});
