# Local Assets Directory

This folder is used for organizing and staging static media assets before bulk-uploading them to Cloudflare R2 / S3 using the `npm run assets:upload` script.

## Directory Structure
Place your files in subdirectories matching the Cloudflare R2 unified key hierarchy:

```
assets/
├── plants/
│   └── <plant-slug>/
│       ├── hero.webp          # 1200x900 hero cover
│       └── gallery/
│           ├── 01.webp        # Gallery photo 1
│           ├── 02.webp        # Gallery photo 2
│           └── ...
├── remedies/
│   └── <remedy-slug>/
│       ├── cover.webp         # 1200x800 remedy cover photo
│       └── steps/
│           ├── 01.webp        # Step 1 illustration
│           └── ...
├── tours/
│   └── <tour-slug>/
│       ├── cover.webp         # 1600x900 full cover
│       ├── cover-thumb.webp   # 640x360 thumbnail (auto-generated if omitted)
│       └── checkpoints/
│           ├── <checkpoint-key>.webp  # 1200x800 checkpoint illustration
│           └── ...
├── scans/
│   └── <user-id>/
│       └── <detection-id>.jpg # Original scanned plant photo
├── users/
│   └── <user-id>/
│       └── avatar.webp        # 256x256 profile avatar
└── _system/
    ├── logo.webp              # Platform branding assets
    └── banner-placeholder.webp
```

## Running Bulk Upload
From the `backend` workspace, run:

```bash
# Dry run to see what would be uploaded without modifying R2
npm run assets:upload -- --dry-run

# Upload all assets from the assets/ folder
npm run assets:upload

# Upload only a specific folder (e.g., tours)
npm run assets:upload -- --only tours

# Upload from a custom folder
npm run assets:upload -- --dir C:/path/to/my-assets
```
