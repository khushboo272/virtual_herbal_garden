import { UserRole } from '../../types';
import { AppError } from '../../core/errors/AppError';

export const ALLOWED_WRITE_PREFIXES = [
  'plants/',
  'models/',
  'remedies/',
  'tours/',
  'avatars/',
  'environment/',
  'uploads/',
  'misc/',
  'trash/',
] as const;

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'model/gltf-binary',
  'application/json',
  'text/csv',
  'application/pdf',
  'video/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
] as const;

export function normalizeKey(rawKey: string): string {
  if (!rawKey || typeof rawKey !== 'string') {
    throw new AppError('Storage key must be a non-empty string', 400);
  }

  // Strip leading slash
  let key = rawKey.trim();
  while (key.startsWith('/')) {
    key = key.slice(1);
  }

  assertKeySafe(key);
  return key;
}

export function assertKeySafe(key: string): void {
  if (!key || key.length === 0) {
    throw new AppError('Storage key cannot be empty', 400);
  }

  if (key.length > 512) {
    throw new AppError('Storage key exceeds maximum limit of 512 bytes', 400);
  }

  if (key.includes('..')) {
    throw new AppError('Path traversal detected in storage key', 400);
  }

  if (key.includes('\\')) {
    throw new AppError('Backslashes are illegal in storage keys', 400);
  }

  // Reject control characters (0x00 - 0x1F and 0x7F)
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f\x7f]/.test(key)) {
    throw new AppError('Control characters are illegal in storage keys', 400);
  }
}

export function assertPrefixWriteAllowed(key: string, userRole: UserRole | string): void {
  const normalized = normalizeKey(key);

  if (normalized.startsWith('backups/')) {
    if (userRole !== UserRole.SUPER_ADMIN && userRole !== 'SUPER_ADMIN') {
      throw new AppError(
        'backups/ storage prefix is read-only and restricted to SUPER_ADMIN',
        403,
      );
    }
    return;
  }

  const isAllowed = ALLOWED_WRITE_PREFIXES.some((prefix) => normalized.startsWith(prefix));
  if (!isAllowed) {
    throw new AppError(
      `Storage key "${normalized}" is outside the permitted write prefix allowlist (${ALLOWED_WRITE_PREFIXES.join(', ')})`,
      403,
    );
  }
}

export function sniffAndValidateMagicBytes(buffer: Buffer, declaredContentType?: string): string {
  if (!buffer || buffer.length === 0) {
    throw new AppError('Empty file buffer provided', 400);
  }

  // Block Windows Executables (MZ) and Linux Executables (\x7fELF)
  if (buffer.length >= 2 && buffer[0] === 0x4d && buffer[1] === 0x5a) {
    throw new AppError('Disallowed executable binary detected (MZ header)', 400);
  }
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x7f &&
    buffer[1] === 0x45 &&
    buffer[2] === 0x4c &&
    buffer[3] === 0x46
  ) {
    throw new AppError('Disallowed executable binary detected (ELF header)', 400);
  }

  // Block HTML / Script disguised as images
  const sample = buffer.subarray(0, Math.min(buffer.length, 512)).toString('utf-8').toLowerCase();
  if (sample.includes('<html') || sample.includes('<script') || sample.includes('<?php')) {
    throw new AppError('Disallowed script/HTML payload detected in storage asset', 400);
  }

  // 1. Binary glTF (GLB): 'glTF'
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString('ascii') === 'glTF') {
    return 'model/gltf-binary';
  }

  // 2. PNG: \x89PNG\r\n\x1a\n
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // 3. JPEG: \xFF\xD8\xFF
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // 4. WebP: 'RIFF....WEBP'
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }

  // 5. PDF: '%PDF-'
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-') {
    return 'application/pdf';
  }

  // 6. JSON
  if (declaredContentType === 'application/json' || sample.trim().startsWith('{') || sample.trim().startsWith('[')) {
    try {
      JSON.parse(buffer.toString('utf-8'));
      return 'application/json';
    } catch {
      // Not valid JSON, continue checks
    }
  }

  // If declared as accepted MIME, verify it's in our allowlist
  if (declaredContentType && ALLOWED_MIME_TYPES.includes(declaredContentType as any)) {
    return declaredContentType;
  }

  return declaredContentType || 'application/octet-stream';
}

