# Cloudflare R2 & Object Storage Architecture — Virtual Herbal Garden

## Overview

The Virtual Herbal Garden asset storage is powered by Cloudflare R2 (S3-compatible object storage) backed by Cloudflare's high-speed global CDN. This document outlines the storage hierarchy, image processing specifications, upload endpoints, fallback strategies, and administrative CLI tools.

---

## 1. Storage Layout & Key Hierarchy

All assets are stored in the bucket (`virtual-herbal-garden-assets`) with predictable, lowercase, slugified object keys partitioned by domain module.

| Module | Key Pattern | Resolution & Format | Cache Policy |
| :--- | :--- | :--- | :--- |
| **Plants (Hero)** | `plants/{slug}/hero.webp` | 1600×900 WebP (82% q) | `max-age=3600, stale-while-revalidate=86400` |
| **Plants (Gallery)** | `plants/{slug}/gallery/{01..99}.webp` | 1200×800 WebP (82% q) | `max-age=31536000, immutable` |
| **Remedies (Cover)** | `remedies/{slug}/cover.webp` | 1200×800 WebP (82% q) | `max-age=3600, stale-while-revalidate=86400` |
| **Remedies (Steps)** | `remedies/{slug}/steps/{01..99}.webp`| 1200×800 WebP (82% q) | `max-age=31536000, immutable` |
| **Tours (Cover Full)**| `tours/{slug}/cover.webp` | 1600×900 WebP (82% q) | `max-age=3600, stale-while-revalidate=86400` |
| **Tours (Cover Thumb)**| `tours/{slug}/cover-thumb.webp` | 640×360 WebP (80% q) | `max-age=3600, stale-while-revalidate=86400` |
| **Tours (Checkpoint)**| `tours/{slug}/checkpoints/{key}.webp`| 1200×800 WebP (82% q) | `max-age=3600, stale-while-revalidate=86400` |
| **AI Scanner** | `scans/{userId}/{scanId}.jpg` | Standard JPEG / Base64 fallback | `max-age=31536000, immutable` |
| **User Profiles** | `users/{userId}/avatar.webp` | 256×256 WebP (80% q) | `max-age=3600, stale-while-revalidate=86400` |
| **System & UI** | `_system/{name}.webp` | Vector / High-res WebP | `max-age=31536000, immutable` |

### Key Sanitization Rules
Implemented in `backend/src/core/storage/assetKeys.ts`:
- Lowercase alphanumeric characters and hyphens only (`[a-z0-9-]+`).
- Path traversal sequences (`..`, `/`, `\`) are strictly prohibited and throw an error.
- Two-digit numerical zero-padding for galleries and remedy steps (`01`, `02`, ..., `12`).

---

## 2. Image Processing Pipeline (`imageProcessor.ts`)

All incoming file uploads are validated via Multer (JPEG, PNG, WebP allowed, 10MB maximum) and piped through `sharp`:

1. **Tour Cover**:
   - Master Cover: Scaled to maximum 1600×900 with fit `inside`, converted to WebP at quality 82.
   - Thumbnail: Resized to 640×360 crop with center fit, converted to WebP at quality 80.
2. **Tour Checkpoints**:
   - Checkpoint Hero: Scaled to maximum 1200×800 with fit `inside`, converted to WebP at quality 82.
3. **Remedy Cover**:
   - Cover Banner: Scaled to maximum 1200×800 with fit `inside`, converted to WebP at quality 82.
4. **User Avatar**:
   - Square Crop: Resized to 256×256 with center cover fit, converted to WebP at quality 80.

---

## 3. Upload & Management Endpoints

| Endpoint | Method | Role Required | Request Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/v1/tours/:id/cover` | `POST` | `ADMIN` (3+) | Multipart: `file` | Uploads full cover & generates thumbnail on R2. Updates `coverImage` on Tour document. |
| `/api/v1/tours/:id/cover` | `DELETE` | `ADMIN` (3+) | Empty | Deletes full cover & thumbnail from R2. Resets `coverImage` on Tour. |
| `/api/v1/tours/:id/checkpoints/:key/image` | `POST` | `ADMIN` (3+) | Multipart: `file` | Uploads checkpoint image on R2. Updates checkpoint `imageUrl`. |
| `/api/v1/remedies/:id/image` | `POST` | `BOTANIST` (2+) | Multipart: `file` | Uploads remedy cover on R2. Updates `imageUrl` on Remedy. |
| `/api/v1/remedies/:id/image` | `DELETE` | `BOTANIST` (2+) | Empty | Deletes remedy cover from R2. Resets `imageUrl` on Remedy. |

---

## 4. Fallback Strategies & Medical Safety

### BUG-004 AI Scanner Fallback
If Cloudflare R2 or S3 is unreachable, rate-limited, or unconfigured:
1. `detectionService` catches the upload exception.
2. Generates an inline 256×256 JPEG base64 data URL (`data:image/jpeg;base64,...`).
3. Saves the data URL to the `Detection` record and continues AI identification with Gemini without blocking the user.
4. Recent Scans list (`getHistory()`) filters strictly for `status: COMPLETE` so failed or orphaned scans never clutter user history.

### Category-Themed Dynamic Placeholders (`ThemedImage.tsx`)
To eliminate broken images without generic gray blocks, frontend cards and detail views use `ThemedImage`:
- **Fallback Hierarchy**:
  1. Primary `src` (Tour cover, remedy cover, plant hero).
  2. Fallback `fallbackSrc` (e.g. linked plant's hero image for a remedy or tour).
  3. Dynamic Category SVG: An animated soft gradient reflecting the health category (e.g., emerald for immunity, amber for digestion, indigo for stress, rose for skin) paired with a Lucide category icon and title text.

---

## 5. Operations & CLI Tooling

### Cloudflare R2 Connection Health Check
Verify storage credentials, bucket connectivity, and read/write/delete capabilities:
```bash
npm run r2:check --workspace=backend
```
Expected output:
```text
✓ Environment configuration valid
✓ S3/R2 client initialized
✓ PutObject probe successful
✓ DeleteObject probe successful
✓ Cloudflare R2 storage is OPERATIONAL
```

### Bulk Asset Upload Script
Sync a local repository folder containing plant, remedy, and tour images into R2:
```bash
npm run assets:upload --workspace=backend -- --dir <path-to-folder> [--dry-run] [--only <module>]
```
- `--dir <path>`: Directory to scan (defaults to `./assets`).
- `--dry-run`: Scans and plans uploads without writing to R2.
- `--only <module>`: Restricts upload to `plants`, `remedies`, `tours`, or `system`.

---

## 6. Environment Variables

```env
# Cloudflare R2 Storage Configuration
R2_ACCOUNT_ID=f64898458710437f99f8cc11e38ea63a
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=virtual-herbal-garden-assets
R2_PUBLIC_URL=https://pub-f64898458710437f99f8cc11e38ea63a.r2.dev
```
