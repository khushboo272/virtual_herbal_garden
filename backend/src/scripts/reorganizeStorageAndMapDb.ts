import { getR2Client } from '../core/storage/r2Storage';
import { connectDB } from '../core/config/db';
import {
  CopyObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import mongoose from 'mongoose';

async function main() {
  const client = getR2Client();
  const bucket = process.env.R2_BUCKET_NAME || 'virtual-herbal-garden-assets';
  const cdnBase = (
    process.env.R2_PUBLIC_URL ||
    process.env.CDN_BASE_URL ||
    'https://pub-f64898458710437f99f8cc11e38ea63a.r2.dev'
  ).replace(/\/+$/, '');

  console.log('──────────────────────────────────────────────────────');
  console.log('🌿 Reorganizing Storage (R2) Folders and Mapping DB');
  console.log(`Bucket:   ${bucket}`);
  console.log(`CDN Base: ${cdnBase}`);
  console.log('──────────────────────────────────────────────────────');

  // 1. Create standard folder .keep markers so folders appear in File Manager
  const keepFolders = [
    'plants/images/',
    'plants/models/',
    'remedies/images/',
    'tours/images/',
    'tours/audios/',
    'avatars/',
    'environment/models/',
    'environment/hdri/',
    'environment/sounds/',
    'environment/textures/',
  ];

  for (const folder of keepFolders) {
    const keepKey = `${folder}.keep`;
    console.log(`Ensuring folder marker: ${keepKey}`);
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: keepKey,
        Body: Buffer.from(''),
        ContentType: 'application/octet-stream',
      })
    );
  }

  // 2. Map existing assets from assets-for-r2/ into the structured hierarchy
  const copyMappings = [
    { src: 'assets-for-r2/models/plants/tulsi.glb', dst: 'plants/models/tulsi.glb' },
    { src: 'assets-for-r2/models/plants/aloevera.glb', dst: 'plants/models/aloe-vera.glb' },
    { src: 'assets-for-r2/models/plants/gotu-kola-lod0.glb', dst: 'plants/models/gotu-kola.glb' },
    { src: 'assets-for-r2/models/plants/Lungwort_spring.glb', dst: 'plants/models/lungwort.glb' },
  ];

  for (const m of copyMappings) {
    try {
      console.log(`Copying ${m.src} -> ${m.dst}`);
      await client.send(
        new CopyObjectCommand({
          Bucket: bucket,
          CopySource: `${bucket}/${m.src}`,
          Key: m.dst,
        })
      );
      console.log(`  ✅ OK: ${m.dst}`);
    } catch (err: any) {
      console.warn(`  ⚠️ Could not copy ${m.src}: ${err.message}`);
    }
  }

  // Also copy environment models, hdri, sounds, textures
  const envList = await client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: 'assets-for-r2/',
    })
  );

  for (const item of envList.Contents || []) {
    if (!item.Key || item.Key.endsWith('.keep')) continue;
    let dstKey: string | null = null;
    if (item.Key.startsWith('assets-for-r2/models/environment/')) {
      dstKey = item.Key.replace('assets-for-r2/models/environment/', 'environment/models/');
    } else if (item.Key.startsWith('assets-for-r2/models/props/')) {
      dstKey = item.Key.replace('assets-for-r2/models/props/', 'environment/models/');
    } else if (item.Key.startsWith('assets-for-r2/hdri/')) {
      dstKey = item.Key.replace('assets-for-r2/hdri/', 'environment/hdri/');
    } else if (item.Key.startsWith('assets-for-r2/sounds/')) {
      dstKey = item.Key.replace('assets-for-r2/sounds/', 'environment/sounds/');
    } else if (item.Key.startsWith('assets-for-r2/textures/')) {
      dstKey = item.Key.replace('assets-for-r2/textures/', 'environment/textures/');
    }

    if (dstKey) {
      try {
        console.log(`Migrating: ${item.Key} -> ${dstKey}`);
        await client.send(
          new CopyObjectCommand({
            Bucket: bucket,
            CopySource: `${bucket}/${item.Key}`,
            Key: dstKey,
          })
        );
      } catch (err: any) {
        console.warn(`  ⚠️ Migration skipped for ${item.Key}: ${err.message}`);
      }
    }
  }

  // 3. Connect to MongoDB and update stable links for retrieval
  console.log('\nConnecting to MongoDB to map stable links...');
  await connectDB();
  const db = mongoose.connection.db!;
  const plantsCollection = db.collection('plants');

  const plants = await plantsCollection.find({ isDeleted: { $ne: true } }).toArray();
  console.log(`Found ${plants.length} plants to map.`);

  for (const plant of plants) {
    const slug = plant.slug;
    const stableModelUrl = `${cdnBase}/plants/models/${slug}.glb`;
    const stableImageUrl = `${cdnBase}/plants/images/${slug}.webp`;

    const updateFields: any = {
      model3dUrl: stableModelUrl,
      modelUrl: stableModelUrl,
    };

    // If plant has existing images, update first image url to stable pattern if it was placeholder or old pattern
    let images = plant.images || [];
    if (images.length === 0) {
      images = [
        {
          url: stableImageUrl,
          isPrimary: true,
          type: 'main',
        },
      ];
    } else {
      images = images.map((img: any, idx: number) => {
        if (idx === 0) {
          return {
            ...img,
            url: stableImageUrl,
            type: (img.type || 'main').toLowerCase(),
          };
        }
        return {
          ...img,
          type: (img.type || 'detail').toLowerCase(),
        };
      });
    }
    updateFields.images = images;

    await plantsCollection.updateOne({ _id: plant._id }, { $set: updateFields });
    console.log(`Mapped plant: ${plant.commonName || slug} -> ${stableModelUrl}`);
  }

  console.log('\n✅ Storage reorganization and database mapping completed successfully!');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Fatal error during reorganization:', err);
  process.exit(1);
});

