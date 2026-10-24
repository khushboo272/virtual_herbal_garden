import {
  sanitizeKeyPart,
  plantHeroKey,
  plantGalleryKey,
  remedyCoverKey,
  remedyStepKey,
  tourCoverKey,
  tourCoverThumbKey,
  tourCheckpointKey,
  scanKey,
  userAvatarKey,
  systemAssetKey,
  publicUrl,
} from '../src/core/storage/assetKeys';

describe('Storage Layout & Asset Keys', () => {
  describe('sanitizeKeyPart', () => {
    it('sanitizes input into lowercase hyphen-delimited alphanumeric characters', () => {
      expect(sanitizeKeyPart('Holy Basil (Tulsi)')).toBe('holy-basil-tulsi');
      expect(sanitizeKeyPart('kitchen_pharmacy_tour!')).toBe('kitchen-pharmacy-tour');
    });

    it('throws error on directory traversal or empty string', () => {
      expect(() => sanitizeKeyPart('../../../etc/passwd')).toThrow();
      expect(() => sanitizeKeyPart('..')).toThrow();
      expect(() => sanitizeKeyPart('   ')).toThrow();
      expect(() => sanitizeKeyPart('')).toThrow();
    });
  });

  describe('key builders', () => {
    it('builds plant keys correctly with 2-digit padding', () => {
      expect(plantHeroKey('holy-basil')).toBe('plants/holy-basil/hero.webp');
      expect(plantGalleryKey('holy-basil', 1)).toBe('plants/holy-basil/gallery/01.webp');
      expect(plantGalleryKey('holy-basil', 12)).toBe('plants/holy-basil/gallery/12.webp');
    });

    it('builds remedy keys correctly with 2-digit padding', () => {
      expect(remedyCoverKey('tulsi-kadha')).toBe('remedies/tulsi-kadha/cover.webp');
      expect(remedyStepKey('tulsi-kadha', 3)).toBe('remedies/tulsi-kadha/steps/03.webp');
    });

    it('builds tour keys correctly', () => {
      expect(tourCoverKey('kitchen-pharmacy')).toBe('tours/kitchen-pharmacy/cover.webp');
      expect(tourCoverThumbKey('kitchen-pharmacy')).toBe('tours/kitchen-pharmacy/cover-thumb.webp');
      expect(tourCheckpointKey('kitchen-pharmacy', 'cp-turmeric')).toBe(
        'tours/kitchen-pharmacy/checkpoints/cp-turmeric.webp'
      );
    });

    it('builds scan keys with .jpg extension and user avatar / system keys', () => {
      expect(scanKey('u-12345', 'scan-67890')).toBe('scans/u-12345/scan-67890.jpg');
      expect(userAvatarKey('u-12345')).toBe('users/u-12345/avatar.webp');
      expect(systemAssetKey('banner-placeholder')).toBe('_system/banner-placeholder.webp');
    });
  });

  describe('publicUrl', () => {
    it('formats public CDN/R2 URL cleanly and adds optional cachebuster version query', () => {
      const base = 'https://media.virtualherbalgarden.org';
      expect(publicUrl('plants/tulsi/hero.webp', undefined, base)).toBe(
        'https://media.virtualherbalgarden.org/plants/tulsi/hero.webp'
      );
      expect(publicUrl('plants/tulsi/hero.webp', 1700000000, base)).toBe(
        'https://media.virtualherbalgarden.org/plants/tulsi/hero.webp?v=1700000000'
      );
      expect(publicUrl('plants/tulsi/hero.webp', '2.0', base)).toBe(
        'https://media.virtualherbalgarden.org/plants/tulsi/hero.webp?v=2.0'
      );
    });
  });

  describe('validateImageMagicBytes', () => {
    it('detects JPEG magic bytes (FF D8 FF)', async () => {
      const { validateImageMagicBytes } = await import('../src/core/utils/imageProcessor');
      const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
      expect(validateImageMagicBytes(buffer)).toBe('image/jpeg');
    });

    it('detects PNG magic bytes (89 50 4E 47)', async () => {
      const { validateImageMagicBytes } = await import('../src/core/utils/imageProcessor');
      const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      expect(validateImageMagicBytes(buffer)).toBe('image/png');
    });

    it('detects WebP magic bytes (RIFF....WEBP)', async () => {
      const { validateImageMagicBytes } = await import('../src/core/utils/imageProcessor');
      const buffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x00, 0x00, 0x00, 0x00,
        0x57, 0x45, 0x42, 0x50, // WEBP
      ]);
      expect(validateImageMagicBytes(buffer)).toBe('image/webp');
    });

    it('returns null for unknown byte signatures', async () => {
      const { validateImageMagicBytes } = await import('../src/core/utils/imageProcessor');
      const buffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);
      expect(validateImageMagicBytes(buffer)).toBeNull();
    });
  });

  describe('isR2Configured', () => {
    it('returns boolean reflecting environment presence', async () => {
      const { isR2Configured } = await import('../src/core/storage/r2Storage');
      expect(typeof isR2Configured()).toBe('boolean');
    });
  });

  describe('storage fallback mechanism', () => {
    it('gracefully saves locally when S3 is unreachable or credentials are invalid', async () => {
      const { storageService } = await import('../src/core/utils/storageService');
      const sharp = (await import('sharp')).default;
      const pngBuffer = await sharp({
        create: {
          width: 200,
          height: 200,
          channels: 4,
          background: { r: 50, g: 150, b: 50, alpha: 1 },
        },
      })
        .png()
        .toBuffer();
      const result = await storageService.uploadPlantImage(pngBuffer, 'test-plant', 'test-img');
      expect(result).toHaveProperty('url');
      expect(result.url).toMatch(/^\/uploads\/plants\/test-plant\/images\/test-img-full\.webp|https?:\/\//);
      expect(result).toHaveProperty('thumbnailUrl');
      expect(result).toHaveProperty('cardUrl');
    });
  });
});

