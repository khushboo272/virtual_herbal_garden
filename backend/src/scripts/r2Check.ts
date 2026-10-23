import { checkR2Health } from '../core/storage/r2Storage';

async function main() {
  console.log('──────────────────────────────────────────────────────');
  console.log('🔍 Cloudflare R2 / S3 Storage Health Check');
  console.log('──────────────────────────────────────────────────────');

  try {
    const health = await checkR2Health();

    console.log(`Configured:  ${health.configured ? 'YES' : 'NO'}`);
    console.log(`Bucket:      ${health.bucket || '(none)'}`);
    console.log(`Public Base: ${health.publicUrl || '(none)'}`);
    console.log(`Reachable:   ${health.reachable ? 'YES' : 'NO'}`);
    console.log(`Status:      ${health.reachable ? '✅ PASS' : (health.configured ? '❌ FAIL' : '⚠️ UNCONFIGURED (FALLBACK ACTIVE)')}`);
    console.log(`Details:     ${health.message}`);
    console.log('──────────────────────────────────────────────────────');

    // Never fail process with code 1 if unconfigured in local dev; exit gracefully with advice
    if (!health.configured || health.reachable) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('❌ Unexpected error during storage health check:', err.message);
    process.exit(1);
  }
}

main();
