import sharp from 'sharp';

interface ProcessedImage {
  thumbnail: Buffer; // 150x150
  card: Buffer; // 400x300
  full: Buffer; // 1200x900
  lqip: string; // base64 low-quality image placeholder
  width: number;
  height: number;
}

export async function processImage(buffer: Buffer): Promise<ProcessedImage> {
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  // Validate minimum resolution
  if (width < 200 || height < 200) {
    throw new Error('Image must be at least 200x200 pixels');
  }

  const [thumbnail, card, full, lqipBuffer] = await Promise.all([
    sharp(buffer).resize(150, 150, { fit: 'cover' }).webp({ quality: 80 }).toBuffer(),
    sharp(buffer).resize(400, 300, { fit: 'cover' }).webp({ quality: 85 }).toBuffer(),
    sharp(buffer).resize(1200, 900, { fit: 'inside' }).webp({ quality: 90 }).toBuffer(),
    sharp(buffer).resize(20, 20, { fit: 'inside' }).blur(10).webp({ quality: 20 }).toBuffer(),
  ]);

  const lqip = `data:image/webp;base64,${lqipBuffer.toString('base64')}`;

  return { thumbnail, card, full, lqip, width, height };
}

export async function processAvatar(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer).resize(256, 256, { fit: 'cover' }).webp({ quality: 85 }).toBuffer();
}

// Validate image by magic bytes (not file extension) per PRD §9.1
export function validateImageMagicBytes(buffer: Buffer): string | null {
  const header = buffer.subarray(0, 12);

  // JPEG: FF D8 FF
  if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
    return 'image/jpeg';
  }
  // PNG: 89 50 4E 47
  if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47) {
    return 'image/png';
  }
  // WebP: RIFF....WEBP
  if (
    header[0] === 0x52 &&
    header[1] === 0x49 &&
    header[2] === 0x46 &&
    header[3] === 0x46 &&
    header[8] === 0x57 &&
    header[9] === 0x45 &&
    header[10] === 0x42 &&
    header[11] === 0x50
  ) {
    return 'image/webp';
  }
  // HEIC: ftyp at offset 4
  if (
    header[4] === 0x66 &&
    header[5] === 0x74 &&
    header[6] === 0x79 &&
    header[7] === 0x70
  ) {
    return 'image/heic';
  }

  return null; // unsupported format
}
