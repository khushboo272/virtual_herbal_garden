import fs from 'fs';
import path from 'path';
import { isR2Configured, putImage } from '../core/storage/r2Storage';
import { validateImageMagicBytes } from '../core/utils/imageProcessor';

interface UploadStats {
  scanned: number;
  uploaded: number;
  skipped: number;
  failed: number;
  totalBytes: number;
}

function parseArgs(): { dir: string; dryRun: boolean; only: string | null } {
  const args = process.argv.slice(2);
  let dir = '';
  let dryRun = false;
  let only: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') {
      dryRun = true;
    } else if (args[i] === '--dir' && args[i + 1]) {
      dir = args[++i];
    } else if (args[i] === '--only' && args[i + 1]) {
      only = args[++i].replace(/^\/+|\/+$/g, '');
    }
  }

  // Default directory: check ../assets (project root) or ./assets (backend root)
  if (!dir) {
    const rootAssets = path.resolve(process.cwd(), '../assets');
    const localAssets = path.resolve(process.cwd(), 'assets');
    dir = fs.existsSync(rootAssets) ? rootAssets : localAssets;
  }

  return { dir: path.resolve(dir), dryRun, only };
}

function getMimeType(filePath: string, buffer: Buffer): string {
  const magic = validateImageMagicBytes(buffer);
  if (magic) return magic;

  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.webp':
      return 'image/webp';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.svg':
      return 'image/svg+xml';
    case '.glb':
      return 'model/gltf-binary';
    case '.json':
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
}

function walkDir(dir: string, baseDir: string, filesList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return filesList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    // Skip OS/system/git artifacts and documentation
    if (
      entry.name.startsWith('.') ||
      entry.name === 'Thumbs.db' ||
      entry.name === 'desktop.ini' ||
      entry.name.toLowerCase() === 'readme.md'
    ) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, baseDir, filesList);
    } else if (entry.isFile()) {
      filesList.push(fullPath);
    }
  }

  return filesList;
}

async function main() {
  const { dir, dryRun, only } = parseArgs();

  console.log('──────────────────────────────────────────────────────');
  console.log('🚀 Virtual Herbal Garden — R2 Bulk Asset Upload');
  console.log('──────────────────────────────────────────────────────');
  console.log(`Source Folder: ${dir}`);
  console.log(`Dry Run:       ${dryRun ? 'YES (No files will be uploaded)' : 'NO'}`);
  console.log(`Filter:        ${only ? `only "${only}"` : 'all modules'}`);
  console.log('──────────────────────────────────────────────────────');

  if (!fs.existsSync(dir)) {
    console.error(`❌ Source folder not found: ${dir}`);
    process.exit(1);
  }

  if (!dryRun && !isR2Configured()) {
    console.error('❌ Cloudflare R2 is not configured in environment variables.');
    console.error('   Please check R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME.');
    process.exit(1);
  }

  const allFiles = walkDir(dir, dir);
  const stats: UploadStats = {
    scanned: allFiles.length,
    uploaded: 0,
    skipped: 0,
    failed: 0,
    totalBytes: 0,
  };

  console.log(`Found ${allFiles.length} file(s) in source directory.\n`);

  for (const fullPath of allFiles) {
    const relPath = path.relative(dir, fullPath).replace(/\\/g, '/');

    // Filter check
    if (only && !relPath.startsWith(only)) {
      stats.skipped++;
      continue;
    }

    try {
      const buffer = fs.readFileSync(fullPath);
      const contentType = getMimeType(fullPath, buffer);
      const sizeKb = (buffer.length / 1024).toFixed(1);

      if (dryRun) {
        console.log(`[DRY-RUN] ${relPath} (${sizeKb} KB, ${contentType})`);
        stats.uploaded++;
        stats.totalBytes += buffer.length;
      } else {
        process.stdout.write(`Uploading ${relPath} (${sizeKb} KB)... `);
        await putImage({
          key: relPath,
          buffer,
          contentType,
          isImmutable: !relPath.startsWith('users/'),
        });
        console.log('✅ OK');
        stats.uploaded++;
        stats.totalBytes += buffer.length;
      }
    } catch (err: any) {
      console.log(`❌ FAILED: ${err.message}`);
      stats.failed++;
    }
  }

  const totalMb = (stats.totalBytes / (1024 * 1024)).toFixed(2);
  console.log('\n──────────────────────────────────────────────────────');
  console.log('📊 Upload Summary');
  console.log('──────────────────────────────────────────────────────');
  console.log(`Scanned:   ${stats.scanned}`);
  console.log(`Uploaded:  ${stats.uploaded}`);
  console.log(`Skipped:   ${stats.skipped}`);
  console.log(`Failed:    ${stats.failed}`);
  console.log(`Total:     ${totalMb} MB`);
  console.log('──────────────────────────────────────────────────────');

  if (stats.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();
