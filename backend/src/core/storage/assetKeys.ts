import { env } from '../config/env';

/**
 * Validates and sanitizes a string segment intended for use in an S3/R2 storage key.
 * Enforces lowercase alphanumeric and hyphens, preventing path traversal or special characters.
 */
export function sanitizeKeyPart(input: string): string {
  if (!input || typeof input !== 'string') {
    throw new Error('Key part must be a non-empty string');
  }

  // Check for path traversal attempts
  if (input.includes('..') || input.includes('/') || input.includes('\\')) {
    throw new Error('Key part contains illegal path traversal characters');
  }

  const cleaned = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/[_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!cleaned) {
    throw new Error(`Sanitized key part is empty after filtering input: "${input}"`);
  }

  return cleaned;
}

/**
 * Zero-pads a number to 2 digits (e.g. 1 -> "01", 12 -> "12").
 */
export function pad2(num: number): string {
  const intVal = Math.max(1, Math.floor(Math.abs(num)));
  return String(intVal).padStart(2, '0');
}

/**
 * Storage key builders for Virtual Herbal Garden Cloudflare R2 / S3 hierarchy:
 * - plants/<slug>/hero.webp
 * - plants/<slug>/gallery/<NN>.webp
 * - remedies/<slug>/cover.webp
 * - remedies/<slug>/steps/<NN>.webp
 * - tours/<slug>/cover.webp
 * - tours/<slug>/cover-thumb.webp
 * - tours/<slug>/checkpoints/<checkpointKey>.webp
 * - scans/<userId>/<detectionId>.jpg
 * - users/<userId>/avatar.webp
 * - _system/<name>.webp
 */

export function plantHeroKey(slug: string): string {
  return `plants/${sanitizeKeyPart(slug)}/hero.webp`;
}

export function plantGalleryKey(slug: string, index: number): string {
  return `plants/${sanitizeKeyPart(slug)}/gallery/${pad2(index)}.webp`;
}

export function remedyCoverKey(slug: string): string {
  return `remedies/${sanitizeKeyPart(slug)}/cover.webp`;
}

export function remedyStepKey(slug: string, stepNumber: number): string {
  return `remedies/${sanitizeKeyPart(slug)}/steps/${pad2(stepNumber)}.webp`;
}

export function tourCoverKey(slug: string): string {
  return `tours/${sanitizeKeyPart(slug)}/cover.webp`;
}

export function tourCoverThumbKey(slug: string): string {
  return `tours/${sanitizeKeyPart(slug)}/cover-thumb.webp`;
}

export function tourCheckpointKey(slug: string, checkpointKey: string): string {
  return `tours/${sanitizeKeyPart(slug)}/checkpoints/${sanitizeKeyPart(checkpointKey)}.webp`;
}

export function scanKey(userId: string, detectionId: string): string {
  return `scans/${sanitizeKeyPart(userId)}/${sanitizeKeyPart(detectionId)}.jpg`;
}

export function userAvatarKey(userId: string): string {
  return `users/${sanitizeKeyPart(userId)}/avatar.webp`;
}

export function systemAssetKey(name: string): string {
  return `_system/${sanitizeKeyPart(name)}.webp`;
}

/**
 * Returns the public CDN / R2 URL for a given storage key.
 * Supports optional cachebuster version query parameter.
 */
export function publicUrl(
  key: string,
  version?: string | number,
  baseUrl?: string
): string {
  const base = (baseUrl || env.R2_PUBLIC_URL || env.CDN_BASE_URL || '').replace(/\/+$/, '');
  const cleanKey = key.replace(/^\/+/, '');
  const url = base ? `${base}/${cleanKey}` : `/${cleanKey}`;

  if (version !== undefined && version !== null && String(version).trim() !== '') {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${encodeURIComponent(String(version))}`;
  }

  return url;
}
