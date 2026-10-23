import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../core/config/db';
import Tour from '../modules/tours/Tour.model';
import Plant from '../modules/library/Plant.model';

export async function backfillTours(): Promise<void> {
  await connectDB();
  const dbName = mongoose.connection.name;
  console.log(`Connected to database: ${dbName}`);

  const toursBefore = await Tour.find({ isDeleted: false });
  console.log(`\n=== BEFORE BACKFILL: ${toursBefore.length} tours ===`);
  for (const t of toursBefore) {
    console.log(`- "${t.title}" (${t.slug}): checkpoints=${t.checkpoints?.length ?? 0}, stops=${t.stops?.length ?? 0}, level=${t.level ?? 'undefined'}`);
  }

  let updatedCount = 0;
  for (const tour of toursBefore) {
    let modified = false;

    // 1. Backfill checkpoints from stops if checkpoints is empty
    if ((!tour.checkpoints || tour.checkpoints.length === 0) && tour.stops && tour.stops.length > 0) {
      const newCheckpoints = [];
      for (let idx = 0; idx < tour.stops.length; idx++) {
        const stop = tour.stops[idx];
        const title = stop.title || `Stop ${stop.order || idx + 1}`;
        const baseKey = title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        const key = baseKey || `cp-${stop.order || idx + 1}`;

        let plantSlug: string | null = null;
        if (stop.plant) {
          if (mongoose.Types.ObjectId.isValid(stop.plant)) {
            const plantDoc = await Plant.findById(stop.plant).select('slug').lean();
            if (plantDoc && plantDoc.slug) {
              plantSlug = plantDoc.slug;
            }
          } else if (typeof stop.plant === 'string') {
            plantSlug = stop.plant;
          }
        }

        newCheckpoints.push({
          key,
          order: stop.order || idx + 1,
          title,
          summary: stop.description || '',
          body: stop.description || '',
          durationMinutes: 3,
          plantSlugs: plantSlug ? [plantSlug] : [],
          remedySlugs: [],
          keyTakeaways: [],
        });
      }

      tour.checkpoints = newCheckpoints as any;
      modified = true;
    }

    // 2. Normalize level
    if (!tour.level) {
      tour.level = (tour.difficulty === 'EASY'
        ? 'BEGINNER'
        : tour.difficulty === 'MEDIUM'
        ? 'INTERMEDIATE'
        : 'ADVANCED') as any;
      modified = true;
    }

    // 3. Normalize summary
    if (!tour.summary && tour.description) {
      tour.summary = tour.description;
      modified = true;
    }

    // 4. Normalize coverImage
    if (!tour.coverImage && tour.coverImageUrl) {
      tour.coverImage = tour.coverImageUrl;
      modified = true;
    }

    // 5. Normalize estimatedMinutes
    if (!tour.estimatedMinutes && tour.estimatedDuration) {
      tour.estimatedMinutes = tour.estimatedDuration;
      modified = true;
    }

    if (modified) {
      await tour.save();
      updatedCount++;
      console.log(`✅ Backfilled tour: "${tour.title}" (${tour.slug})`);
    } else {
      console.log(`⏭️ Tour already up to date: "${tour.title}" (${tour.slug})`);
    }
  }

  const toursAfter = await Tour.find({ isDeleted: false });
  console.log(`\n=== AFTER BACKFILL: ${toursAfter.length} tours (updated ${updatedCount}) ===`);
  for (const t of toursAfter) {
    console.log(`- "${t.title}" (${t.slug}): checkpoints=${t.checkpoints?.length ?? 0}, stops=${t.stops?.length ?? 0}, level=${t.level ?? 'undefined'}`);
  }

  await disconnectDB();
}

if (require.main === module) {
  backfillTours()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Backfill error:', err);
      process.exit(1);
    });
}
